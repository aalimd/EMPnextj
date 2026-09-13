'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildExplorerCase,
  compareExplorerCases,
  explorerContainsPoint,
  getCurriculumSources,
  getExplorerCases,
  getExplorerPathways,
  nextExplorerPractice,
  readExplorerPractice,
  readExplorerProgress,
  saveExplorerPractice,
  saveExplorerProgress,
  type ExplorerBuild,
  type ExplorerProgress,
} from '@/lib/ecg/api';
import { resolveEcgTarget } from '@/data/ecgGuide';
import { STUDENT_LEARNING } from '@/lib/learn/studentLearning';
import { useDocTitle } from '@/lib/useDocTitle';
import { ConfidenceRating } from '@/components/learn/ConfidenceRating';

const READING_STEPS: Array<[string, string, string]> = [
  ['rate', 'Rate', 'What rate can you estimate?'],
  ['rhythm', 'Rhythm', 'Describe the timing and P–QRS relationship.'],
  ['axis', 'Axis', 'Assess only if the required leads are shown.'],
  ['intervals', 'Intervals', 'Describe PR, QRS and QT where assessable.'],
  ['stt', 'ST–T changes', 'Which leads and waveform features stand out?'],
  ['context', 'Summary and limits', 'What does the tracing suggest, and what information is missing?'],
];

const FINDING_HANDOFF = 'em-explorer-finding';

/** Uniquify inline SVG ids per instance (legacy `instanceSvg` parity). */
function instanceSvg(svg: string, suffix: string): string {
  const ids: Record<string, string> = {};
  let out = svg.replace(/\bid="([^"]+)"/g, (_m, id: string) => {
    ids[id] = `${id}${suffix}`;
    return `id="${ids[id]}"`;
  });
  out = out.replace(/url\(#([^)]*)\)/g, (all: string, id: string) => (ids[id] ? `url(#${ids[id]})` : all));
  out = out.replace(/aria-labelledby="([^"]+)"/g, (_m: string, list: string) =>
    `aria-labelledby="${list
      .split(' ')
      .map((id) => ids[id] || id)
      .join(' ')}"`,
  );
  return out;
}

interface ExplorerState {
  finding: number;
  region: number;
  highlights: boolean;
  zoom: string;
  answer: string;
  observations: Record<string, string>;
  hint: boolean;
  revealed: boolean;
  compare: boolean;
  locating: boolean;
  locationFeedback: string;
  path: number | null;
  findingMenu: boolean;
  checklistOpen: boolean;
  pathOpen: boolean;
  enlarged: boolean;
  cursor: { x: number; y: number } | null;
}

export default function ExplorerCaseView({
  caseId,
  initialPractice,
}: {
  caseId: string;
  initialPractice?: boolean;
}): JSX.Element {
  const router = useRouter();
  const cases = useMemo(() => getExplorerCases(), []);
  const pathways = useMemo(() => getExplorerPathways(), []);
  const sources = useMemo(() => getCurriculumSources(), []);
  const record = cases.find((c) => c.id === caseId) ?? cases[0];

  const [practice, setPractice] = useState(!!initialPractice);
  const [st, setSt] = useState<ExplorerState>({
    finding: 0,
    region: 0,
    highlights: true,
    zoom: '1',
    answer: '',
    observations: {},
    hint: false,
    revealed: !initialPractice,
    compare: false,
    locating: false,
    locationFeedback: '',
    path: null,
    findingMenu: false,
    checklistOpen: false,
    pathOpen: false,
    enlarged: false,
    cursor: null,
  });
  const [progress, setProgress] = useState<ExplorerProgress>({ last: 'normal', finding: 0, completed: [], review: [] });
  const [persisted, setPersisted] = useState(true);
  const [attempted, setAttempted] = useState<string[]>([]);
  const [practicePersisted, setPracticePersisted] = useState(true);
  const paperRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useDocTitle(record ? `${record.name} — ECG Explorer` : 'ECG Explorer');

  // Initial progress + handoff finding.
  useEffect(() => {
    let p: ExplorerProgress;
    try {
      p = readExplorerProgress();
    } catch {
      p = { last: 'normal', finding: 0, completed: [], review: [] };
    }
    setProgress(p);
    try {
      const raw = sessionStorage.getItem(FINDING_HANDOFF);
      if (raw) {
        sessionStorage.removeItem(FINDING_HANDOFF);
        const f = Number(JSON.parse(raw).finding);
        if (Number.isInteger(f) && f >= 0) {
          setSt((s) => ({ ...s, finding: f, region: 0, highlights: true }));
          return;
        }
      }
    } catch {
      /* handoff is best-effort */
    }
    if (caseId === p.last) {
      setSt((s) => ({ ...s, finding: Math.max(0, p.finding) }));
    }
    try {
      setAttempted(readExplorerPractice());
    } catch {
      setAttempted([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId]);

  // Persist location + student resume memory.
  useEffect(() => {
    try {
      const ok = saveExplorerProgress({ ...progress, last: record.id, finding: st.finding });
      setPersisted(ok);
    } catch {
      setPersisted(false);
    }
    try {
      (STUDENT_LEARNING as unknown as { remember(route: string): void }).remember(`ecg-explorer~${record.id}`);
    } catch {
      /* best-effort */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, st.finding]);

  const concealed = practice && !st.revealed;
  const item: ExplorerBuild = useMemo(() => {
    try {
      return buildExplorerCase(record.id, concealed);
    } catch {
      return {
        record,
        svg: '',
        findings: [],
        caption: 'This teaching example could not be rendered.',
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record.id, concealed]);

  const findingIndex = Math.max(0, Math.min(item.findings.length - 1, st.finding));
  const finding = item.findings[findingIndex];
  const hidden = concealed;
  const suppress = hidden || st.locating;

  const patch = useCallback((p: Partial<ExplorerState>) => {
    setSt((s) => ({ ...s, ...p }));
  }, []);

  // Enlarged-view dialog: Escape closes, focus starts on the close action.
  useEffect(() => {
    if (!st.enlarged) return;
    dialogRef.current?.querySelector('button')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') patch({ enlarged: false });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [st.enlarged, patch]);

  const resetReading = useCallback(
    (keepPractice: boolean) => {
      patch({
        answer: '',
        observations: {},
        hint: false,
        findingMenu: false,
        region: 0,
        finding: 0,
        zoom: '1',
        locating: false,
        locationFeedback: '',
        revealed: !keepPractice,
        cursor: null,
      });
    },
    [patch],
  );

  const goCase = useCallback(
    (id: string, findingIdx = 0) => {
      resetReading(practice);
      if (id !== record.id) {
        try {
          sessionStorage.setItem(FINDING_HANDOFF, JSON.stringify({ finding: findingIdx }));
        } catch {
          /* best-effort */
        }
        router.push(`/explorer/${id}`);
      } else {
        patch({ finding: findingIdx, region: 0, highlights: true });
      }
    },
    [practice, record.id, resetReading, router, patch],
  );

  const order = st.path === null ? cases.map((c) => c.id) : (pathways[st.path]?.ids ?? cases.map((c) => c.id));

  const svgWithMarks = useMemo(() => {
    let svg = item.svg;
    if (!suppress && st.highlights && finding) {
      const marks = finding.targets
        .map(
          ([x, y, w, h], i) =>
            `<ellipse cx="${x + w / 2}" cy="${y + h / 2}" rx="${w / 2}" ry="${h / 2}" data-region="${i}" tabindex="0" role="button" aria-pressed="${i === st.region}" aria-label="Inspect marked region ${i + 1} for ${finding.title.replace(/"/g, '')}"/>`,
        )
        .join('');
      svg = svg.replace(/<\/svg>\s*$/, `<g class="ecg-finding-marks">${marks}</g></svg>`);
      svg = svg.replace('aria-hidden="true"', 'role="group"');
    }
    return instanceSvg(svg, `-view${findingIndex}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.svg, suppress, st.highlights, findingIndex, st.region]);

  const detailCrop = useMemo(() => {
    if (suppress || !finding || !item.width || !item.height) return null;
    const targets = finding.targets;
    const region = Math.min(st.region, targets.length - 1);
    const [x, y, w, h] = targets[region];
    const pad = 20;
    const left = Math.max(0, x - pad);
    const top = Math.max(0, y - pad);
    const vw = Math.min(item.width - left, w + pad * 2);
    const vh = Math.min(item.height - top, h + pad * 2);
    let svg = item.svg.replace(/viewBox="[^"]+"/, `viewBox="${left} ${top} ${vw} ${vh}"`);
    svg = svg.replace(/<g\b[^>]*class="ecg-finding-marks"[\s\S]*?<\/g>/g, '');
    svg = svg.replace(/aria-labelledby="[^"]*"/g, '');
    svg = svg.replace('aria-hidden="true"', 'role="img"');
    return { svg: instanceSvg(svg, `-detail${findingIndex}-${region}`), region, total: targets.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.svg, item.width, item.height, suppress, findingIndex, st.region]);

  const comparison = useMemo(() => {
    if (!st.compare || suppress) return null;
    try {
      const ref = compareExplorerCases(record.id, record.id);
      if (!ref) return { unavailable: true as const };
      return { svg: instanceSvg(ref.svg, '-ref'), note: (ref as { note?: string }).note ?? '' };
    } catch {
      return { unavailable: true as const };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.compare, suppress, record.id]);

  const categories = useMemo(() => [...new Set(cases.map((c) => c.category))], [cases]);

  const recordAttempt = (): void => {
    if (!st.answer.trim() && !Object.values(st.observations).some((v) => v.trim())) return;
    if (!attempted.includes(record.id)) {
      const next = [...attempted, record.id];
      setAttempted(next);
      try {
        setPracticePersisted(saveExplorerPractice(next));
      } catch {
        setPracticePersisted(false);
      }
    }
  };

  const saveProgressList = (next: ExplorerProgress): void => {
    setProgress(next);
    try {
      setPersisted(saveExplorerProgress({ ...next, last: record.id, finding: findingIndex }));
    } catch {
      setPersisted(false);
    }
  };

  const checkLocation = (x: number, y: number): void => {
    const ok = finding.targets.some((r) => {
      try {
        return explorerContainsPoint(r, x, y);
      } catch {
        return false;
      }
    });
    patch({
      locationFeedback: ok
        ? 'Correct region. Reveal the explanation to check the waveform feature.'
        : 'That point is outside the marked teaching region. Try another lead or segment, or show the explanation.',
    });
  };

  const onPaperClick = (e: React.MouseEvent): void => {
    const svg = paperRef.current?.querySelector('svg');
    if (!svg) return;
    const pt = (svg as SVGSVGElement).createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = (svg as SVGSVGElement).getScreenCTM();
    if (!ctm) return;
    const p = pt.matrixTransform(ctm.inverse());
    if (st.locating) {
      checkLocation(p.x, p.y);
      return;
    }
    if ((practice && !st.revealed) || !st.highlights || !finding) return;
    const region = finding.targets.findIndex((r) => {
      try {
        return explorerContainsPoint(r, p.x, p.y);
      } catch {
        return false;
      }
    });
    if (region < 0) return;
    patch({ region });
  };

  const onPaperKey = (e: React.KeyboardEvent): void => {
    const target = e.target as Element;
    const regionEl = target.closest?.('[data-region]');
    if (regionEl && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      patch({ region: Number(regionEl.getAttribute('data-region')) });
      return;
    }
    if (!st.locating || !target.classList?.contains('explorer-paper')) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Enter'].includes(e.key)) return;
    e.preventDefault();
    const svg = paperRef.current?.querySelector('svg');
    const vb = (svg as unknown as { viewBox: { baseVal: { width: number; height: number } } })?.viewBox?.baseVal;
    if (!svg || !vb) return;
    const cursor = st.cursor ?? { x: vb.width / 2, y: vb.height / 2 };
    const step = e.shiftKey ? 4 : 20;
    if (e.key === 'Enter') {
      checkLocation(cursor.x, cursor.y);
      return;
    }
    patch({
      cursor: {
        x: Math.max(0, Math.min(vb.width, cursor.x + (e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0))),
        y: Math.max(0, Math.min(vb.height, cursor.y + (e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0))),
      },
    });
  };

  const guideHref = item.record.guide ? `/ecg#section-${resolveEcgTarget(item.record.guide)}` : '/ecg';
  const source = item.record.source ? sources[item.record.source] : undefined;
  const svgWithCursor = useMemo(() => {
    if (!st.cursor) return svgWithMarks;
    const { x, y } = st.cursor;
    return svgWithMarks.replace(
      /<\/svg>\s*$/,
      `<path class="explorer-cursor" d="M${x - 10},${y}h20 M${x},${y - 10}v20"/></svg>`,
    );
  }, [svgWithMarks, st.cursor]);

  if (!record) {
    return (
      <section role="alert">
        <h1>ECG Explorer could not open</h1>
        <p>Reload to try again. Your saved progress will be kept.</p>
        <p>
          <Link href="/">Back to library</Link>
        </p>
      </section>
    );
  }

  return (
    <section className="ecg-explorer">
      <div className="explorer-heading">
        <div>
          <p className="explorer-kicker">ECG LEARNING LIBRARY</p>
          <h1>ECG Explorer</h1>
          <p>{cases.length} teaching examples. Select a finding to see exactly where to look.</p>
        </div>
        <button type="button" className="ex-button" onClick={() => patch({ enlarged: true })}>
          Enlarge ECG
        </button>
      </div>

      <div className="explorer-controls">
        <label>
          Teaching ECG
          <select
            data-control="case"
            aria-label="Teaching ECG"
            value={record.id}
            onChange={(e) => {
              patch({ path: null });
              resetReading(practice);
              if (e.target.value !== record.id) router.push(`/explorer/${e.target.value}`);
            }}
          >
            {practice
              ? cases.map((c, i) => (
                  <option key={c.id} value={c.id}>
                    Case {String(i + 1).padStart(2, '0')}
                  </option>
                ))
              : categories.map((category) => (
                  <optgroup label={category} key={category}>
                    {cases
                      .filter((c) => c.category === category)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </optgroup>
                ))}
          </select>
        </label>
        <button
          type="button"
          className="ex-button"
          aria-label="Previous ECG"
          onClick={() => {
            const i = order.indexOf(record.id);
            goCase(order[(i + order.length - 1) % order.length]);
            resetReading(practice);
          }}
        >
          ← Previous
        </button>
        <button
          type="button"
          className="ex-button"
          aria-label="Next ECG"
          onClick={() => {
            const i = order.indexOf(record.id);
            goCase(order[(i + 1) % order.length]);
            resetReading(practice);
          }}
        >
          Next →
        </button>
        <label>
          Zoom
          <select data-control="zoom" aria-label="ECG zoom" value={st.zoom} onChange={(e) => patch({ zoom: e.target.value })}>
            {[
              ['1', 'Whole ECG'],
              ['1.5', '150%'],
              ['2', '200%'],
              ['3', '300%'],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="ex-button"
          aria-pressed={practice}
          onClick={() => {
            const next = !practice;
            setPractice(next);
            patch({ path: null });
            resetReading(next);
            router.push(next ? '/explorer/practice' : `/explorer/${record.id}`);
          }}
        >
          ECG Practice
        </button>
        {!hidden ? (
          <button
            type="button"
            className="ex-button"
            aria-pressed={st.highlights}
            onClick={() => patch({ highlights: !st.highlights })}
          >
            Red highlights
          </button>
        ) : null}
      </div>

      <section className="explorer-progress" aria-label="Learning progress">
        <div>
          <strong>
            {progress.completed.length} / {cases.length} cases completed
          </strong>
          <progress max={cases.length} value={progress.completed.length} aria-label="Completed ECG cases" />
          <small>{persisted ? 'Progress stays on this device.' : 'Storage unavailable; progress lasts for this visit.'}</small>
        </div>
        <button
          type="button"
          className="ex-button"
          onClick={() => {
            if (st.path !== null) {
              const flat = pathways.flatMap((p) => p.ids);
              const i = flat.indexOf(record.id);
              const after = [...flat.slice(i + 1), ...flat.slice(0, i)];
              const next = after.find((id) => !progress.completed.includes(id));
              if (next) {
                patch({ path: pathways.findIndex((p) => p.ids.includes(next)) });
                resetReading(practice);
                router.push(`/explorer/${next}`);
              }
              return;
            }
            const next = cases.find((c) => !progress.completed.includes(c.id) && c.id !== record.id)
              ?? cases.find((c) => !progress.completed.includes(c.id));
            if (next) {
              resetReading(practice);
              router.push(`/explorer/${next.id}`);
            }
          }}
        >
          Continue learning →
        </button>
        {progress.review.length ? (
          <button
            type="button"
            className="ex-button"
            onClick={() => {
              const key = progress.review.find((k) => k !== `${record.id}:${findingIndex}`) ?? progress.review[0];
              const [id, f] = key.split(':');
              resetReading(practice);
              goCase(id, Number(f) || 0);
            }}
          >
            Review saved findings ({progress.review.length})
          </button>
        ) : null}
        <button
          type="button"
          className="ex-button"
          onClick={() => {
            const next = nextExplorerPractice(attempted, record.id);
            setPractice(true);
            patch({ path: null });
            resetReading(true);
            router.push(next === record.id ? '/explorer/practice' : `/explorer/${next}`);
          }}
        >
          {practice ? 'Next practice case →' : 'Try mixed practice'}
        </button>
      </section>

      {!practice ? (
        <details className="explorer-path" open={st.pathOpen} onToggle={(e) => patch({ pathOpen: (e.target as HTMLDetailsElement).open })}>
          <summary>
            Suggested learning path <span>Start here or choose any case</span>
          </summary>
          <p>Optional order · take one example at a time. Completion records what you studied, not a proficiency score.</p>
          <ol>
            {pathways.map((path, i) => (
              <li key={path.title}>
                <strong>{path.title}</strong>
                <p>{path.objective}</p>
                <small>
                  Suggested preparation: {path.prior} · {path.ids.filter((id) => progress.completed.includes(id)).length} / {path.ids.length} studied
                </small>
                <button
                  type="button"
                  className="ex-button"
                  onClick={() => {
                    const pid = path.ids.find((id) => !progress.completed.includes(id)) ?? path.ids[0];
                    patch({ path: i, pathOpen: false });
                    resetReading(practice);
                    if (pid !== record.id) router.push(`/explorer/${pid}`);
                  }}
                >
                  {st.path === i ? 'Continue this stage' : 'Start this stage'}
                </button>
              </li>
            ))}
          </ol>
        </details>
      ) : null}
      {st.path !== null && pathways[st.path] ? (
        <p className="explorer-path-current">
          <strong>{pathways[st.path].title}</strong> · Example {pathways[st.path].ids.indexOf(record.id) + 1} of {pathways[st.path].ids.length}
          <br />
          {pathways[st.path].objective}{' '}
          <button type="button" className="ex-button" onClick={() => patch({ path: null })}>
            Browse all cases
          </button>
        </p>
      ) : null}

      {practice ? (
        <p className="explorer-practice-status">
          {attempted.length} / {cases.length} interpretations attempted
          {practicePersisted ? ' on this device.' : ' — storage unavailable; this visit only.'} Cases with no recorded
          attempt are chosen first. These are library examples, and written answers are not scored.
        </p>
      ) : null}

      {item.record.stem ? <p className="explorer-clinical-stem">{item.record.stem}</p> : null}

      <div className={`explorer-layout${st.compare && !suppress ? ' has-comparison' : ''}`}>
        <section className="explorer-sheet" aria-label="ECG teaching paper">
          {st.locating && !hidden ? (
            <div className="explorer-explanation">
              <strong>Locate: {finding?.title}</strong>
              <p>
                Tap the matching region on the main ECG. You can also use the keyboard: focus the ECG and move the
                cursor with arrow keys, then press Enter.
              </p>
              <p className="explorer-location-feedback" role="status">
                {st.locationFeedback}
              </p>
              <button
                type="button"
                className="ex-button"
                onClick={() => patch({ locating: false, highlights: true, findingMenu: true })}
              >
                Show location and explanation
              </button>
            </div>
          ) : null}
          <div className="explorer-paper-hint">
            {item.scale ?? ''} <span>Whole ECG overview · select a finding for detail.</span>
            {st.zoom !== '1' ? (
              <button type="button" className="ex-button explorer-whole" onClick={() => patch({ zoom: '1' })}>
                Whole ECG
              </button>
            ) : null}
          </div>
          <div
            className="explorer-paper"
            ref={paperRef}
            tabIndex={0}
            role="region"
            aria-label={st.locating && finding ? `Locate ${finding.title}. Use arrow keys to move, Shift for smaller steps, Enter to check.` : 'ECG paper; scroll to inspect'}
            onClick={onPaperClick}
            onKeyDown={onPaperKey}
          >
            <div className="explorer-canvas" style={{ width: `${Number(st.zoom) * 100}%` }} dangerouslySetInnerHTML={{ __html: svgWithCursor }} />
          </div>
          <p className="explorer-caption">
            {item.caption}
            {!suppress && st.highlights ? ' Tap a red region to inspect it; keyboard users can Tab to a region and press Enter.' : ''}
          </p>
        </section>

        <aside className="explorer-findings" aria-label="Diagnosis and findings">
          {hidden ? (
            <>
              <p className="explorer-kicker">YOUR INTERPRETATION</p>
              <h2>Read before revealing</h2>
              <p>What are the rate, rhythm and important findings? Use the whole ECG.</p>
            </>
          ) : (
            <>
              <p className="explorer-kicker">{item.format ?? ''} · CURRENT DIAGNOSIS / PATTERN</p>
              <h2>{item.record.name}</h2>
              <p>{item.record.summary}</p>
            </>
          )}
          {practice ? (
            <>
              <details
                className="explorer-checklist"
                open={st.checklistOpen}
                onToggle={(e) => patch({ checklistOpen: (e.target as HTMLDetailsElement).open })}
              >
                <summary>Use a guided reading checklist (optional)</summary>
                <p>Write what you can observe. Use “not assessable” when the necessary leads or features are unavailable. Notes last for this case only.</p>
                {READING_STEPS.map(([key, label, hint]) => (
                  <label key={key}>
                    {label}
                    <textarea
                      rows={2}
                      data-observation={key}
                      placeholder={hint}
                      value={st.observations[key] ?? ''}
                      onChange={(e) => patch({ observations: { ...st.observations, [key]: e.target.value } })}
                    />
                  </label>
                ))}
              </details>
              <label className="explorer-answer">
                Your interpretation
                <textarea
                  data-control="answer"
                  rows={3}
                  placeholder="Rate, rhythm, intervals, ST–T changes…"
                  value={st.answer}
                  onChange={(e) => patch({ answer: e.target.value })}
                />
              </label>
            </>
          ) : null}
          {hidden ? (
            <>
              <div className="explorer-hint">
                <button type="button" className="ex-button" aria-expanded={st.hint} onClick={() => patch({ hint: !st.hint })}>
                  {st.hint ? 'Hide reading hint' : 'Give me a reading hint'}
                </button>
                {st.hint ? (
                  <p role="status">
                    Start with the recording labels and what leads are available. Describe the timing, then the
                    repeating wave shapes. Write an observation before choosing a diagnosis; you can leave uncertain
                    items unanswered.
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                className="ex-button ex-primary"
                onClick={() => {
                  recordAttempt();
                  patch({ revealed: true });
                }}
              >
                Reveal diagnosis &amp; findings
              </button>
            </>
          ) : (
            <>
              <h3>
                Findings <span>{item.findings.length}</span>
              </h3>
              {item.findings.length > 4 ? (
                <details
                  className="explorer-finding-chooser"
                  open={st.findingMenu}
                  onToggle={(e) => patch({ findingMenu: (e.target as HTMLDetailsElement).open })}
                >
                  <summary>Choose a finding · {item.findings.length} available</summary>
                </details>
              ) : null}
              <div className="explorer-finding-list">
                {item.findings.map((f, i) => (
                  <button
                    key={i}
                    type="button"
                    data-finding={i}
                    aria-pressed={i === findingIndex}
                    onClick={() => {
                      patch({ finding: i, findingMenu: false, region: 0, highlights: true, locationFeedback: '' });
                    }}
                  >
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    {f.title}
                  </button>
                ))}
              </div>
              {finding ? (
                <div className="explorer-explanation" role="status">
                  {detailCrop ? (
                    <div className="explorer-detail">
                      <p>
                        Marked region {detailCrop.region + 1} of {detailCrop.total} · detail view
                      </p>
                      <div dangerouslySetInnerHTML={{ __html: detailCrop.svg }} />
                      {detailCrop.total > 1 ? (
                        <button
                          type="button"
                          className="ex-button"
                          onClick={() => patch({ region: (st.region + 1) % detailCrop.total })}
                        >
                          Next marked region →
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  <strong>{finding.title}</strong>
                  <p>{finding.explanation}</p>
                  <button
                    type="button"
                    className="ex-button"
                    onClick={() => {
                      patch({ zoom: '2', highlights: true });
                      paperRef.current?.focus({ preventScroll: true });
                      paperRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
                    }}
                  >
                    Focus this finding
                  </button>
                  <nav className="explorer-finding-nav" aria-label="Finding navigation">
                    <button
                      type="button"
                      className="ex-button"
                      aria-label="Previous finding"
                      onClick={() => patch({ finding: (findingIndex + item.findings.length - 1) % item.findings.length, region: 0, highlights: true })}
                    >
                      ← Finding
                    </button>
                    <span>
                      {findingIndex + 1} / {item.findings.length}
                    </span>
                    <button
                      type="button"
                      className="ex-button"
                      aria-label="Next finding"
                      onClick={() => patch({ finding: (findingIndex + 1) % item.findings.length, region: 0, highlights: true })}
                    >
                      Finding →
                    </button>
                  </nav>
                </div>
              ) : null}
              <Link className="explorer-guide-link" href={guideHref}>
                Open the ECG guide →
              </Link>
            </>
          )}
          {!hidden && source ? (
            <p className="explorer-source">
              <a target="_blank" rel="noopener noreferrer" href={source.url}>
                {source.label}
              </a>
            </p>
          ) : null}
          {practice && st.revealed && !st.locating ? (
            <p className="explorer-practice-feedback">
              Compare your interpretation with each explained finding below. Your written answer is not automatically graded.
            </p>
          ) : null}
          {practice && st.revealed ? (
            <section className="explorer-confidence">
              <p>How did you do? Self-assessment, not a mastery score.</p>
              <ConfidenceRating ratingKey={`ecg:${record.id}`} />
            </section>
          ) : null}
          {!hidden ? (
            <div className="explorer-learning-actions">
              <button
                type="button"
                className="ex-button"
                aria-pressed={progress.completed.includes(record.id)}
                onClick={() => {
                  const list = [...progress.completed];
                  const i = list.indexOf(record.id);
                  if (i < 0) list.push(record.id);
                  else list.splice(i, 1);
                  saveProgressList({ ...progress, completed: list });
                }}
              >
                {progress.completed.includes(record.id) ? '✓ Case completed' : 'Mark case complete'}
              </button>
              <button
                type="button"
                className="ex-button"
                aria-pressed={progress.review.includes(`${record.id}:${findingIndex}`)}
                onClick={() => {
                  const key = `${record.id}:${findingIndex}`;
                  const list = [...progress.review];
                  const i = list.indexOf(key);
                  if (i < 0) list.push(key);
                  else list.splice(i, 1);
                  saveProgressList({ ...progress, review: list });
                }}
              >
                {progress.review.includes(`${record.id}:${findingIndex}`) ? 'Finding saved for review' : 'Review this finding later'}
              </button>
              <button
                type="button"
                className="ex-button"
                aria-pressed={st.locating}
                onClick={() => patch({ locating: !st.locating, locationFeedback: '' })}
              >
                {st.locating ? 'Exit location exercise' : 'Practice locating this finding'}
              </button>
              <button
                type="button"
                className="ex-button"
                aria-pressed={st.compare}
                onClick={() => patch({ compare: !st.compare })}
              >
                Compare normal
              </button>
            </div>
          ) : null}
        </aside>
      </div>

      {st.compare && !suppress ? (
        <section className="explorer-comparison" aria-label="Normal comparison">
          {comparison && 'unavailable' in comparison ? (
            <p>
              This mixed-gain voltage diagram already contains high- and low-voltage examples. A matched normal overlay
              is unavailable; compare its labeled amplitudes using the stated gain.
            </p>
          ) : comparison ? (
            <>
              <div className="explorer-paper-hint">Normal sinus reference · 72/min</div>
              <div className="explorer-reference-paper" tabIndex={0} role="region" aria-label="Normal ECG; synchronized scrolling">
                <div className="explorer-reference-canvas" style={{ width: `${Number(st.zoom) * 100}%` }} dangerouslySetInnerHTML={{ __html: comparison.svg }} />
              </div>
              <p>{comparison.note}</p>
            </>
          ) : null}
        </section>
      ) : null}

      {st.enlarged ? (
        <div className="explorer-dialog" ref={dialogRef} role="dialog" aria-modal="true" aria-label="ECG Explorer enlarged view">
          <div className="explorer-dialog-card">
            <div className="explorer-dialog-head">
              <strong>{item.record.name}</strong>
              <button type="button" className="ex-button" onClick={() => patch({ enlarged: false })}>
                Close enlarged view
              </button>
            </div>
            <div className="explorer-paper" tabIndex={0} role="region" aria-label="Enlarged ECG paper">
              <div className="explorer-canvas" style={{ width: '200%' }} dangerouslySetInnerHTML={{ __html: svgWithMarks }} />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
