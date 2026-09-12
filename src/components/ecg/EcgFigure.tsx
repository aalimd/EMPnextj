'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getEcgFigure } from '@/lib/ecg/api';
import { ECG_WAVE_INFO, ECG_WAVE_NAMES, ECG_WAVE_ORDER, ecgWaveText } from '@/lib/ecg/waveInfo';
import { closeEcgViewer, openEcgViewer } from '@/lib/ecg/api';

const HINT = 'Hover or tap a wave — P · PR · QRS · ST · T · QT · CAL · RR.';

function withRefRole(svg: string): string {
  if (!svg) return '';
  return svg.includes('ecg-hot') ? svg.replace('aria-hidden="true"', 'role="group"') : svg;
}

export default function EcgFigure({ figureId }: { figureId: string }): JSX.Element {
  const entry = getEcgFigure(figureId);
  const [selected, setSelected] = useState<string | null>(null);
  const [hideAnno, setHideAnno] = useState(false);
  const [showRef, setShowRef] = useState(false);
  const [focusView, setFocusView] = useState<string>('');
  const figRef = useRef<HTMLElement>(null);

  const waves = useMemo(() => {
    if (!entry?.svg) return [];
    return ECG_WAVE_ORDER.filter((w) => (entry.svg as string).includes(`data-wave="${w}"`));
  }, [entry]);

  useEffect(() => {
    setSelected(null);
    setHideAnno(false);
    setShowRef(false);
    setFocusView('');
  }, [figureId]);

  useEffect(() => {
    const onEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') {
        setSelected(null);
        clearMarks();
      }
    };
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, []);

  useEffect(() => {
    return () => {
      try {
        closeEcgViewer();
      } catch {
        /* noop */
      }
    };
  }, []);

  if (!entry || (!entry.svg && !entry.png)) {
    return (
      <p className="empty-filter" role="status">
        ECG figure unavailable. Use the written criteria and a reviewed tracing.
      </p>
    );
  }

  const title = String(entry.title ?? figureId);
  const caption = String(entry.caption ?? 'Teaching diagram; not a patient recording.');
  const hasHot = !!entry.svg && (entry.svg as string).includes('ecg-hot');
  const hint = hasHot
    ? `Hover or tap: ${waves.map((w) => ECG_WAVE_NAMES[w] ?? w.toUpperCase()).join(' · ')}.`
    : '';

  function clearMarks(): void {
    const fig = figRef.current;
    if (!fig) return;
    fig.querySelectorAll('.ecg-inline-marks').forEach((m) => m.remove());
  }

  function showWaveByName(wave: string): void {
    const fig = figRef.current;
    if (!fig) return;
    if (selected === wave) {
      setSelected(null);
      clearMarks();
      fig.querySelectorAll('.ecg-hot').forEach((h) => {
        h.classList.remove('on');
        h.setAttribute('aria-pressed', 'false');
      });
      return;
    }
    setSelected(wave);
    fig.setAttribute('data-sel', wave);
    const hot = fig.querySelector(`.ecg-hot[data-wave="${wave}"]`);
    if (hot) {
      drawMark(hot as SVGGElement);
      fig.querySelectorAll('.ecg-hot').forEach((h) => {
        const on = h === hot;
        h.classList.toggle('on', on);
        h.setAttribute('aria-pressed', String(on));
      });
    } else {
      clearMarks();
    }
  }

  function drawMark(hot: SVGGElement): void {
    const fig = figRef.current;
    const svg = hot.ownerSVGElement;
    if (!fig || !svg) return;
    try {
      const zone = hot.querySelector('.ecg-hotzone') as SVGGraphicsElement | null;
      const target = zone ?? (hot as unknown as SVGGraphicsElement);
      let bounds = target.getBBox();
      const svgCtm = svg.getCTM();
      const hotCtm = (hot as unknown as SVGGraphicsElement).getCTM();
      if (svgCtm && hotCtm) {
        const matrix = svgCtm.inverse().multiply(hotCtm);
        const pt = svg.createSVGPoint();
        const corners = [
          [bounds.x, bounds.y],
          [bounds.x + bounds.width, bounds.y],
          [bounds.x, bounds.y + bounds.height],
          [bounds.x + bounds.width, bounds.y + bounds.height],
        ].map(([x, y]) => {
          pt.x = x;
          pt.y = y;
          return pt.matrixTransform(matrix);
        });
        const xs = corners.map((p) => p.x);
        const ys = corners.map((p) => p.y);
        bounds = {
          x: Math.min(...xs),
          y: Math.min(...ys),
          width: Math.max(...xs) - Math.min(...xs),
          height: Math.max(...ys) - Math.min(...ys),
        } as DOMRect;
      }
      fig.querySelectorAll('.ecg-inline-marks').forEach((m) => m.remove());
      if (bounds.width > 0 && bounds.height > 0) {
        const mark = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        mark.setAttribute('class', 'ecg-inline-marks');
        mark.setAttribute('cx', String(bounds.x + bounds.width / 2));
        mark.setAttribute('cy', String(bounds.y + bounds.height / 2));
        mark.setAttribute('rx', String(bounds.width / 2));
        mark.setAttribute('ry', String(bounds.height / 2));
        svg.appendChild(mark);
      }
    } catch {
      /* Mark overlay is best-effort; the inspector text still updates. */
    }
  }

  const inspectorText = selected && ECG_WAVE_INFO[selected]
    ? `${ECG_WAVE_INFO[selected][0]} — ${ECG_WAVE_INFO[selected][1]}`
    : hint || 'Select a wave to read its explanation.';

  const svgHtml = withRefRole(String(entry.svg ?? ''));
  const fullView = (svgHtml.match(/viewBox="([^"]+)"/) ?? [])[1] ?? '';

  const onSvgInteract = (e: React.MouseEvent | React.FocusEvent): void => {
    const hot = (e.target as Element).closest?.('.ecg-hot');
    if (hot) {
      const wave = hot.getAttribute('data-wave');
      if (wave && wave !== selected) showWaveByName(wave);
    }
  };

  const onSvgKey = (e: React.KeyboardEvent): void => {
    const hot = (e.target as Element).closest?.('.ecg-hot');
    if (hot && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      const wave = hot.getAttribute('data-wave');
      if (wave) showWaveByName(wave);
    }
  };

  const openViewer = (e: React.MouseEvent<HTMLButtonElement>): void => {
    try {
      openEcgViewer(figureId, e.currentTarget, { wave: selected });
    } catch {
      /* Workbench is best-effort; the inline figure remains. */
    }
  };

  return (
    <figure
      className={`ecg-fig${hideAnno ? ' hide-anno' : ''}${showRef ? ' show-reference' : ''}`}
      data-ecg-fig={figureId}
      ref={figRef as React.RefObject<HTMLElement>}
    >
      {Array.isArray(entry.previewPanels) && entry.previewPanels.length ? (
        <label className="ecg-panel-select">
          Focus{' '}
          <select
            aria-label="Diagram focus"
            data-ecg-panel
            value={focusView || fullView}
            onChange={(e) => setFocusView(e.target.value)}
          >
            <option value={fullView}>Whole diagram</option>
            {(entry.previewPanels as Array<{ viewBox: string; title: string }>).map((p) => (
              <option key={p.viewBox} value={p.viewBox}>
                {p.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div
        className="ecg-media"
        tabIndex={0}
        role="region"
        aria-label="ECG figure; scroll horizontally to inspect"
        onClick={onSvgInteract}
        onMouseOver={onSvgInteract}
        onFocus={onSvgInteract}
        onKeyDown={onSvgKey}
      >
        <div
          className="ecg-svg-wrap"
          dangerouslySetInnerHTML={{ __html: focusView ? svgHtml.replace(/viewBox="[^"]+"/, `viewBox="${focusView}"`) : svgHtml }}
        />
      </div>
      <figcaption>
        <span className="ecg-schem">{String(entry.figureLabel ?? 'Schematic · not to scale')}</span>
        {caption}
      </figcaption>
      <div className="ecg-tools" role="group" aria-label={`Diagram tools for ${title}`}>
        {figureId === 'normal-12lead' ? null : (
          <button
            type="button"
            className="ecg-tool"
            data-ecg-tool="anno"
            aria-pressed={!hideAnno}
            title="Show or hide measurement labels"
            onClick={() => setHideAnno((v) => !v)}
          >
            {hideAnno ? 'Show labels' : 'Annotations'}
          </button>
        )}
        {entry.hasReference ? (
          <button
            type="button"
            className="ecg-tool"
            data-ecg-tool="compare"
            aria-pressed={showRef}
            title="Modeled same-lead normal reference at matching QRS onset times"
            onClick={() => setShowRef((v) => !v)}
          >
            Normal reference
          </button>
        ) : null}
        <button
          type="button"
          className="ecg-tool"
          data-ecg-tool="expand"
          title="Enlarge the ECG, inspect findings and use available measurement tools"
          onClick={openViewer}
        >
          Explore ECG
        </button>
      </div>
      {waves.length ? (
        <div className="ecg-wavebtns" role="group" aria-label={`Waves and intervals in ${title}`}>
          {waves.map((w) => (
            <button
              key={w}
              type="button"
              className="ecg-wavebtn"
              data-ecg-wavebtn={w}
              aria-pressed={selected === w}
              onClick={() => showWaveByName(w)}
            >
              {ECG_WAVE_NAMES[w] ?? w.toUpperCase()}
            </button>
          ))}
        </div>
      ) : null}
      {waves.length ? (
        <div className="ecg-inspector" data-hint={hint} aria-live="polite">
          {inspectorText}
        </div>
      ) : null}
    </figure>
  );
}

export { ecgWaveText };
