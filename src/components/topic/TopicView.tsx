'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import type { ClinicalTopic } from '@/types';
import { TOPICS, getTopic } from '@/data/topics';
import { GROUPS, RELATED } from '@/lib/libraryMeta';
import { useChrome } from '@/components/chrome/ChromeContext';
import { useDocTitle } from '@/lib/useDocTitle';
import { EM_LEARNING } from '@/lib/learn/emLearning';
import TopicIcon from '@/components/library/TopicIcon';
import SectionCard from './SectionCard';
import RedFlagChecklist from './RedFlagChecklist';
import RecallPractice from './RecallPractice';
import { PersonalPlan, ReviewButton } from './LearningControls';
import EvidenceList from './EvidenceList';
import { GuidedReasoning, StudentIntro } from '@/components/learn/StudentEnhancements';

const SEV_LABEL: Record<string, string> = { critical: 'Critical', emergent: 'Emergent', common: 'Common' };

function dispClass(title: string): string {
  const t = title.toLowerCase();
  if (t.startsWith('discharge')) return 'd-discharge';
  if (t.startsWith('admit') || t.startsWith('urgent')) return 'd-admit';
  return 'd-icu';
}

function clusterGrid(items: string[]): JSX.Element {
  return (
    <div className="cluster-grid">
      {items.map((h, i) => {
        const s = String(h);
        const cut = s.indexOf(': ');
        if (cut > 0 && cut < 52) {
          return (
            <div className="cluster" key={i}>
              <h4>{s.slice(0, cut)}</h4>
              <p>{s.slice(cut + 2)}</p>
            </div>
          );
        }
        return (
          <div className="cluster" key={i}>
            <p>{s}</p>
          </div>
        );
      })}
    </div>
  );
}

const ECG_FROM_PRESENTATIONS: Record<string, boolean> = {
  'chest-pain': true, palpitations: true, syncope: true, overdose: true, shock: true,
  dyspnea: true, ams: true, coma: true, 'heat-cold': true, weakness: true, hyperglycemia: true,
};

function orderedIds(): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const g of GROUPS) {
    for (const id of g.ids) {
      if (getTopic(id) && !seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  for (const t of TOPICS) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      out.push(t.id);
    }
  }
  return out;
}

function jumpToSection(key: string): void {
  const card = document.getElementById(`section-${key}`);
  if (!card) return;
  const parent = card.classList.contains('section-card') ? card : card.closest('.section-card');
  if (parent?.classList.contains('closed')) {
    parent.classList.remove('closed');
    parent.querySelector('.sec-head')?.setAttribute('aria-expanded', 'true');
  }
  const head = card.querySelector('.sec-head');
  const topbar = document.querySelector('.topbar');
  const offset = (topbar ? topbar.getBoundingClientRect().height : 0) + 12;
  const top = card.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  card.classList.add('section-focus');
  window.setTimeout(() => card.classList.remove('section-focus'), 1800);
  (head as HTMLElement | null)?.focus?.({ preventScroll: true });
}

export default function TopicView({ topic }: { topic: ClinicalTopic }): JSX.Element {
  const { severity } = useChrome();
  useDocTitle(topic.name);

  // Deep-link sections (`/topic/id#section-red-flags`, search-result jumps).
  useEffect(() => {
    const fromHash = (): void => {
      const hash = window.location.hash.replace(/^#section-/, '');
      if (hash) jumpToSection(hash);
    };
    const t = window.setTimeout(fromHash, 60);
    window.addEventListener('hashchange', fromHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hashchange', fromHash);
    };
  }, [topic.id]);

  const dxTitle = severity === 'all' ? 'Don’t-Miss Diagnoses' : `Don’t-Miss Diagnoses · ${SEV_LABEL[severity]} only`;
  const dxItems = topic.dontMiss.filter((d) => severity === 'all' || d[1] === severity);

  const overview = useMemo(() => {
    const text = String(topic.overview || '').trim();
    const end = text.search(/[.!?]\s/);
    const lead = end < 0 ? text : text.slice(0, end + 1);
    const rest = end < 0 ? '' : text.slice(end + 1).trim();
    return { lead, rest };
  }, [topic]);

  const ids = useMemo(orderedIds, []);
  const idx = ids.indexOf(topic.id);
  const prev = idx > 0 ? getTopic(ids[idx - 1]) : undefined;
  const next = idx >= 0 && idx < ids.length - 1 ? getTopic(ids[idx + 1]) : undefined;

  const related = (RELATED[topic.id] ?? []).map((id) => getTopic(id)).filter((t): t is ClinicalTopic => Boolean(t));

  let reassessment = '';
  let evidenceContext = '';
  try {
    reassessment = (EM_LEARNING as unknown as { reassessmentHtml(cp: ClinicalTopic): string }).reassessmentHtml(topic);
    evidenceContext = (EM_LEARNING as unknown as { evidenceContext(id: string): string }).evidenceContext(topic.id);
  } catch {
    reassessment = '';
    evidenceContext = '';
  }

  const firstAction = topic.approach[0] ?? 'Stabilize the patient, then use the local pathway.';
  const threats = topic.dontMiss.filter((d) => d[1] === 'critical').slice(0, 3).map((d) => d[0]);

  const toc: Array<[string, string]> = [
    ['how-to-think', 'Approach'],
    ['dont-miss', 'Don’t miss'],
    ['red-flags', 'Red flags'],
    ['history', 'Assessment'],
    ['workup', 'Workup'],
    ['disposition', 'Disposition'],
    ['study', 'Recall & notes'],
  ];

  return (
    <>
      <div className="cp-hero">
        <Link href="/" className="back-btn" id="backBtn">
          ← All presentations
        </Link>
        <TopicIcon id={topic.id} large />
        <h1 id="presentationTitle" tabIndex={-1}>
          {topic.name}
        </h1>
        <p className="tag">{topic.tag}</p>
      </div>
      <StudentIntro topicId={topic.id} />

      <nav className="presentation-toc" aria-label="Presentation sections">
        {toc.map(([key, label]) => (
          <button key={key} type="button" className="section-jump" data-jump={key} onClick={() => jumpToSection(key)}>
            {label}
          </button>
        ))}
      </nav>

      <SectionCard icon="🧭" title="How to think" sectionKey="how-to-think">
        <div className="ov">
          <p className="ov-job">
            <span className="ov-kicker">The job</span>
            {topic.tag}
          </p>
          {topic.approach.length ? (
            <ol className="ov-steps">
              {topic.approach.map((s, i) => (
                <li key={i}>
                  <span className="ov-n" aria-hidden="true">{i + 1}</span>
                  <span className="ov-s">{s}</span>
                </li>
              ))}
            </ol>
          ) : null}
          <div className="ov-prose">
            {overview.lead ? <p>{overview.lead}</p> : null}
            {overview.rest ? <p>{overview.rest}</p> : null}
          </div>
        </div>
      </SectionCard>

      <aside className="case-rail" aria-label="First five minutes">
        <div className="case-rail-title">
          <span aria-hidden="true">
            <svg className="mono-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="m13 2-9 12h7l-1 8 10-12h-7z" />
            </svg>
          </span>
          <div>
            <strong>First 5 minutes</strong>
            <small>Start here, then work the case</small>
          </div>
        </div>
        <ol className="case-steps">
          {topic.approach.slice(0, 3).map((step, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </aside>

      <SectionCard icon="🚨" title={dxTitle} sectionKey="dont-miss">
        {dxItems.length ? (
          <div className="dx-grid">
            {dxItems.map((d, i) => (
              <div className={`dx-card sev-${d[1]}`} key={i}>
                <h4>
                  <span className={`sev-dot sev-${d[1]}`} aria-hidden="true" />
                  {d[0]} <span className="sev-tag">{SEV_LABEL[d[1]] ?? d[1]}</span>
                </h4>
                <div className="dx-key">
                  <strong>Key:</strong> {d[2]}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '.84rem', color: 'var(--ink-soft)', padding: '6px 0' }}>
            No diagnoses in this severity tier.
          </p>
        )}
      </SectionCard>

      <SectionCard icon="🚩" title="Interactive Red-Flag Checklist" sectionKey="red-flags">
        <RedFlagChecklist topic={topic} />
      </SectionCard>

      <SectionCard icon="🗣️" title="Focused History" sectionKey="history" defaultClosed>
        {clusterGrid(topic.history)}
      </SectionCard>

      <SectionCard icon="🩺" title="Examination Clusters" sectionKey="exam" defaultClosed>
        {clusterGrid(topic.exam)}
      </SectionCard>

      <SectionCard icon="🧪" title="Workup" sectionKey="workup">
        <div className="wu-grid">
          {topic.workup.map((w, i) => (
            <div className="wu-col" key={i}>
              <h4>{w[0]}</h4>
              <ul>
                {w[1].map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <details className="medication-safety">
          <summary>Medication safety reminder</summary>
          <p>Use this as a first-pass prompt; verify all medications, doses, concentrations, contraindications, weight, pregnancy status, and local protocols before administration.</p>
          <p>Check indication, allergy, route, renal/hepatic risk, interactions, monitoring, and local formulary.</p>
        </details>
      </SectionCard>

      <SectionCard icon="🏥" title="Disposition Pathway" sectionKey="disposition">
        <div className="disp-grid">
          {topic.disposition.map((d, i) => (
            <div className={`disp-col ${dispClass(d[0])}`} key={i}>
              <h4>{d[0]}</h4>
              <ul>
                <li>{d[1]}</li>
              </ul>
            </div>
          ))}
        </div>
        <p className="clinical-safety-note">Use objective reassessment and the local pathway.</p>
        {reassessment ? <div dangerouslySetInnerHTML={{ __html: reassessment }} /> : null}
      </SectionCard>

      <SectionCard icon="💡" title="Pearls & Pitfalls" sectionKey="pearls-pitfalls" defaultClosed>
        <div className="pp-grid">
          <div className="pp-box pearls">
            <h4>Clinical Pearls</h4>
            <ul className="plain-list">
              {Array.isArray(topic.pearls) && topic.pearls.length ? (
                topic.pearls.map((p, i) => <li key={i}>{p}</li>)
              ) : (
                topic.dontMiss
                  .filter((d) => d[1] === 'critical')
                  .slice(0, 4)
                  .map((d, i) => (
                    <li key={i}>
                      <strong>{d[0]}:</strong> {d[2]}
                    </li>
                  ))
              )}
            </ul>
          </div>
          <div className="pp-box pitfalls">
            <h4>Pitfalls</h4>
            <ul className="plain-list">
              {topic.pitfalls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      <section className="presentation-study-group" id="section-study" aria-label="Recall and notes" tabIndex={-1}>
        <section className="learning-loop" aria-label="Rapid recall practice">
          <div className="learning-head">
            <div>
              <span className="learning-kicker">PRACTICE REFRESHER</span>
              <h2>Rapid recall</h2>
              <p>Test your first action and the dangerous diagnoses before revealing the answer.</p>
            </div>
            <ReviewButton topicId={topic.id} />
          </div>
          <RecallPractice
            topicId={topic.id}
            items={[
              { index: 'action', label: '01 · First move', prompt: 'Before you scroll, what needs to happen first?', answer: firstAction },
              {
                index: 'threats',
                label: '02 · Immediate threats',
                prompt: 'Name at least two diagnoses that cannot wait.',
                answer: threats.join(' · ') || 'Use the presentation’s red flags and local escalation pathway.',
              },
            ]}
          />
        </section>
        <PersonalPlan topicId={topic.id} />
        <GuidedReasoning topicId={topic.id} />
      </section>

      {related.length || ECG_FROM_PRESENTATIONS[topic.id] ? (
        <SectionCard icon="🔗" title="See also" sectionKey="see-also">
          <div className="related">
            {related.map((r) => (
              <Link key={r.id} className="related-chip" href={`/topic/${r.id}`}>
                <span className="chip-ico" data-cat={r.id} aria-hidden="true">
                  <TopicIcon id={r.id} side />
                </span>
                {r.name}
              </Link>
            ))}
            {ECG_FROM_PRESENTATIONS[topic.id] ? (
              <Link className="related-chip" href="/ecg">
                <span className="chip-ico" data-cat="ecg" aria-hidden="true">
                  <TopicIcon id="ecg" side />
                </span>
                ECG Guide
              </Link>
            ) : null}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard icon="📚" title="References" sectionKey="references" defaultClosed>
        <EvidenceList topicId={topic.id} />
        {evidenceContext ? (
          <div dangerouslySetInnerHTML={{ __html: evidenceContext }} />
        ) : null}
        <ul className="refs">
          {topic.refs.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      </SectionCard>

      <div className="pager">
        {prev ? (
          <Link className="pager-btn" href={`/topic/${prev.id}`}>
            ← {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link className="pager-btn" href={`/topic/${next.id}`}>
            {next.name} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </>
  );
}
