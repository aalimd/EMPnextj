'use client';

import Link from 'next/link';
import { Fragment, useEffect, useState } from 'react';
import { ECG_GUIDE, ECG_CAT_LABEL } from '@/data/ecgGuide';
import { useChrome } from '@/components/chrome/ChromeContext';
import { useDocTitle } from '@/lib/useDocTitle';
import { richHtml } from '@/lib/rich';
import { EM_LEARNING } from '@/lib/learn/emLearning';
import TopicIcon from '@/components/library/TopicIcon';
import SectionCard from '@/components/topic/SectionCard';
import RecallPractice from '@/components/topic/RecallPractice';
import { PersonalPlan, ReviewButton } from '@/components/topic/LearningControls';
import EvidenceList from '@/components/topic/EvidenceList';
import EcgFigure from '@/components/ecg/EcgFigure';
import { getTopic } from '@/data/topics';

const SEV_LABEL: Record<string, string> = { critical: 'Critical', emergent: 'Emergent', common: 'Common' };

function scrollToSection(key: string, smooth = true): void {
  const card = document.getElementById(`section-${key}`);
  if (!card) return;
  const parent = card.classList.contains('section-card') ? card : card.closest('.section-card');
  if (parent?.classList.contains('closed')) {
    parent.classList.remove('closed');
    parent.querySelector('.sec-head')?.setAttribute('aria-expanded', 'true');
  }
  const topbar = document.querySelector('.topbar');
  const offset = (topbar ? topbar.getBoundingClientRect().height : 0) + 12;
  const top = card.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
}

export default function EcgGuideView({ focus }: { focus?: string }): JSX.Element {
  const ecg = ECG_GUIDE;
  const { severity } = useChrome();
  const [category, setCategory] = useState('all');
  useDocTitle('ECG Guide');

  useEffect(() => {
    const fromHash = (): void => {
      const hash = window.location.hash.replace(/^#section-/, '');
      const target = focus ?? hash ?? '';
      if (target) scrollToSection(target, false);
    };
    const t = window.setTimeout(fromHash, 80);
    window.addEventListener('hashchange', fromHash);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('hashchange', fromHash);
    };
  }, [focus]);

  const first = ecg.firstPass[0] ?? 'Treat the unstable patient before decorating the 12-lead.';
  const killers = ecg.patterns.filter((p) => p.severity === 'critical').slice(0, 5).map((p) => p.name);

  const visible = ecg.patterns.filter((p) => {
    if (focus && p.id === focus) return true;
    if (severity !== 'all' && p.severity !== severity) return false;
    if (category !== 'all' && p.category !== category) return false;
    return true;
  });

  let evidenceContext = '';
  try {
    evidenceContext = (EM_LEARNING as unknown as { evidenceContext(id: string): string }).evidenceContext('ecg');
  } catch {
    evidenceContext = '';
  }

  return (
    <>
      <div className="cp-hero">
        <Link href="/" className="back-btn" id="backBtn">
          ← All presentations
        </Link>
        <TopicIcon id="ecg" large />
        <h1 id="ecgTitle" tabIndex={-1}>
          ECG interpretation
        </h1>
        <p className="tag">{ecg.tag}</p>
        {ecg.subtitle ? <p className="ecg-subhead">{ecg.subtitle}</p> : null}
      </div>

      <nav className="ecg-step-nav" aria-label="Seven-step method">
        {ecg.steps.map((s) => (
          <button key={s.id} type="button" className="ecg-step-chip" onClick={() => scrollToSection(`ecg-step-${s.id}`)}>
            <span>{s.num}</span>
            {s.name}
          </button>
        ))}
        <button type="button" className="ecg-step-chip" onClick={() => scrollToSection('ecg-patterns')}>
          Patterns
        </button>
      </nav>

      <p className="student-safety">{ecg.firstPass[0]}</p>
      <details className="reference-firstpass">
        <summary>Urgent ECG assessment · reference checklist</summary>
        <aside className="case-rail" aria-label="First thirty seconds">
          <div className="case-rail-title">
            <span aria-hidden="true">
              <svg className="mono-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="m13 2-9 12h7l-1 8 10-12h-7z" />
              </svg>
            </span>
            <div>
              <strong>First 30 seconds</strong>
              <small>Shift-first pass, then the 7-step method</small>
            </div>
          </div>
          <ol className="case-steps">
            {ecg.firstPass.map((step, i) => (
              <li key={i}>
                <span>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          <div className="case-actions">
            <button type="button" className="case-action primary" onClick={() => scrollToSection('ecg-red-flags')}>
              Red flags
            </button>
            <button type="button" className="case-action" onClick={() => scrollToSection(`ecg-step-${ecg.steps[0].id}`)}>
              Start 7-step
            </button>
            <button type="button" className="case-action" onClick={() => scrollToSection('ecg-patterns')}>
              Pattern library
            </button>
          </div>
        </aside>
      </details>

      {ecg.steps.map((s) => (
        <SectionCard
          key={s.id}
          icon={s.icon ?? '📈'}
          title={`Step ${s.num} · ${s.name}`}
          sectionKey={`ecg-step-${s.id}`}
          defaultClosed={s.num !== 1}
        >
          <p className="ecg-summary">{s.summary}</p>
          <EcgFigure figureId={s.id} />
          {s.id === 'rate-calibration' ? <EcgFigure figureId="normal-12lead" /> : null}
          <ul className="ecg-details">
            {s.details.map((line, i) => {
              const t = String(line);
              const sub = t.charAt(0) === '•';
              return (
                <li key={i} className={sub ? 'ecg-sub' : ''} dangerouslySetInnerHTML={{ __html: richHtml(sub ? t.replace(/^•\s*/, '') : t) }} />
              );
            })}
          </ul>
          <div className="pp-grid ecg-pp">
            <div className="pp-box pearls">
              <h4>Pearl</h4>
              <p>{s.pearl ?? ''}</p>
            </div>
            <div className="pp-box pitfalls">
              <h4>Pitfall</h4>
              <p>{s.pitfall ?? ''}</p>
            </div>
          </div>
        </SectionCard>
      ))}

      <details className="ecg-pattern-index">
        <summary>Jump to a pattern</summary>
        <div className="ecg-killers" aria-label="Killer patterns">
          {ecg.patterns
            .filter((p) => p.severity === 'critical')
            .map((p) => (
              <button key={p.id} type="button" className="ecg-killer" onClick={() => scrollToSection(`ecg-pattern-${p.id}`)}>
                <strong>{p.name}</strong>
                <small>{p.tag}</small>
              </button>
            ))}
        </div>
      </details>

      <SectionCard icon="🗂️" title="Pattern library" sectionKey="ecg-patterns" defaultClosed>
        <p className="ecg-summary">Choose a category, or use the severity filter above.</p>
        <div className="ecg-filters" role="group" aria-label="ECG pattern category">
          {[['all', 'All patterns'], ...Object.entries(ECG_CAT_LABEL)].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={`chip${category === key ? ' active' : ''}`}
              aria-pressed={category === key}
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="ecg-pattern-grid">
          {visible.length ? (
            visible.map((p) => (
              <article className={`ecg-pattern sev-${p.severity}`} id={`section-ecg-pattern-${p.id}`} data-section={`ecg-pattern-${p.id}`} tabIndex={-1} key={p.id}>
                <header>
                  <span className="sev-tag">
                    <span className={`sev-dot sev-${p.severity}`} aria-hidden="true" />
                    {SEV_LABEL[p.severity] ?? ''}
                  </span>
                  <span className="ecg-cat">{ECG_CAT_LABEL[p.category] ?? p.category}</span>
                </header>
                <h3>{p.name}</h3>
                <p className="ecg-tagline">{p.tag}</p>
                <EcgFigure figureId={p.id} />
                {Array.isArray(p.comparison) ? (
                  <div className="ecg-comparison">
                    <h4>Distinguish the patterns</h4>
                    <dl>
                      {p.comparison.map(([dt, dd], i) => (
                        <Fragment key={i}>
                          <dt>{dt}</dt>
                          <dd>{dd}</dd>
                        </Fragment>
                      ))}
                    </dl>
                  </div>
                ) : null}
                {p.leads ? (
                  <p className="ecg-leads">
                    <strong>Leads:</strong> <span dangerouslySetInnerHTML={{ __html: richHtml(p.leads) }} />
                  </p>
                ) : null}
                <p>
                  <strong>Criteria:</strong> <span dangerouslySetInnerHTML={{ __html: richHtml(p.criteria) }} />
                </p>
                {p.significance ? (
                  <p>
                    <strong>Why it matters:</strong> <span dangerouslySetInnerHTML={{ __html: richHtml(p.significance) }} />
                  </p>
                ) : null}
                <div className="ecg-action">
                  <strong>Action:</strong> <span dangerouslySetInnerHTML={{ __html: richHtml(p.action) }} />
                </div>
                {p.caution ? (
                  <p className="ecg-caution">
                    <strong>Caution:</strong> <span dangerouslySetInnerHTML={{ __html: richHtml(p.caution) }} />
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <p className="empty-filter">No patterns in this filter. Choose All, or another severity/category.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard icon="🧭" title="How to think" sectionKey="ecg-how" defaultClosed>
        <div className="ov">
          <p className="ov-job">
            <span className="ov-kicker">The job</span>
            {ecg.tag}
          </p>
          <ol className="ov-steps">
            {ecg.firstPass.map((s, i) => (
              <li key={i}>
                <span className="ov-n" aria-hidden="true">{i + 1}</span>
                <span className="ov-s">{s}</span>
              </li>
            ))}
          </ol>
          {ecg.overview ? (
            <div className="ov-prose">
              <p>{ecg.overview}</p>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard icon="🚩" title="ECG red flags" sectionKey="ecg-red-flags">
        <div className="rf-box">
          <p className="ecg-summary">These findings should move the patient to a different lane now.</p>
          <ul className="plain-list">
            {ecg.redFlags.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </SectionCard>

      <SectionCard icon="💡" title="Pearls & Pitfalls" sectionKey="pearls-pitfalls" defaultClosed>
        <div className="pp-grid">
          <div className="pp-box pearls">
            <h4>Clinical Pearls</h4>
            <ul className="plain-list">
              {ecg.pearls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
          <div className="pp-box pitfalls">
            <h4>Pitfalls</h4>
            <ul className="plain-list">
              {ecg.pitfalls.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      </SectionCard>

      <section className="presentation-study-group" id="section-study" aria-label="Recall and notes" tabIndex={-1}>
        <section className="learning-loop" aria-label="ECG rapid recall">
          <div className="learning-head">
            <div>
              <span className="learning-kicker">PRACTICE REFRESHER</span>
              <h2>Rapid recall</h2>
              <p>Test your first action and the dangerous patterns before revealing the answer.</p>
            </div>
            <ReviewButton topicId="ecg" />
          </div>
          <RecallPractice
            topicId="ecg"
            items={[
              {
                index: 'ecg-action',
                label: '01 · First move',
                prompt: 'The patient is hypotensive with a wide-complex tachycardia. What happens before a prettier 12-lead?',
                answer: first,
              },
              {
                index: 'ecg-threats',
                label: '02 · Killer patterns',
                prompt: 'Name three ECG patterns that should change management in the next minutes.',
                answer: killers.join(' · '),
              },
            ]}
          />
        </section>
        <PersonalPlan topicId="ecg" />
      </section>

      {ecg.related.length ? (
        <SectionCard icon="🔗" title="See also" sectionKey="ecg-related" defaultClosed>
          <div className="related">
            {ecg.related.map((rid) => {
              const r = getTopic(rid);
              if (!r) return null;
              return (
                <Link key={rid} className="related-chip" href={`/topic/${r.id}`}>
                  <span className="chip-ico" data-cat={r.id} aria-hidden="true">
                    <TopicIcon id={r.id} side />
                  </span>
                  {r.name}
                </Link>
              );
            })}
          </div>
        </SectionCard>
      ) : null}

      <SectionCard icon="📚" title="References" sectionKey="ecg-references" defaultClosed>
        <EvidenceList topicId="ecg" />
        {evidenceContext ? <div dangerouslySetInnerHTML={{ __html: evidenceContext }} /> : null}
        <ul className="refs">
          {ecg.refs.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
        <p className="ecg-litfl">
          Diagrams above are original teaching drawings. For real 12-lead tracings see{' '}
          <a href="https://litfl.com/ecg-library/" target="_blank" rel="noopener">
            LITFL ECG Library
          </a>{' '}
          — free for non-profit education with credit to litfl.com (CC BY-NC-SA 4.0).
        </p>
      </SectionCard>
    </>
  );
}
