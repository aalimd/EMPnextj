'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TOPIC_BY_ID, TOPICS } from '@/data/topics';
import { GROUPS, PATIENT_CONTEXTS } from '@/lib/libraryMeta';
import { useChrome } from '@/components/chrome/ChromeContext';
import { useDocTitle } from '@/lib/useDocTitle';
import { homeHtml } from '@/lib/learn/topicAids';
import { rewriteLegacyHrefs } from '@/lib/legacyRoutes';
import { getDueIds, getSavedIds, readLearningStore, reviewLabelFor } from '@/lib/learning';
import TopicIcon from '@/components/library/TopicIcon';
import SeverityChips from '@/components/chrome/SeverityChips';
import StudyStarter from '@/components/study/StudyStarter';
import { STUDENT_LEARNING } from '@/lib/learn/studentLearning';
import type { PatientFilter } from '@/types';

const PATIENT_FILTERS: Array<[PatientFilter, string]> = [
  ['all', 'All patients'],
  ['pediatric', 'Pediatric'],
  ['pregnancy', 'Pregnancy'],
  ['geriatric', 'Older adult'],
  ['immunocompromised', 'Immunocompromised'],
  ['trauma', 'Trauma'],
];

function WorkspaceEntry(): JSX.Element {
  let html = '';
  try {
    html = homeHtml();
  } catch {
    html = '';
  }
  const mapped = rewriteLegacyHrefs(html);
  const onClick = (e: React.MouseEvent): void => {
    const browse = (e.target as Element).closest?.('[data-browse-library]');
    if (browse) {
      e.preventDefault();
      const library = document.getElementById('presentationLibrary');
      if (library) {
        (library as HTMLElement).focus({ preventScroll: true });
        library.scrollIntoView({ block: 'start', behavior: 'smooth' });
      }
    }
  };
  if (!mapped) return <></>;
  return <div onClick={onClick} dangerouslySetInnerHTML={{ __html: mapped }} />;
}

function StudyDashboard(): JSX.Element | null {
  const [due, setDue] = useState(0);
  const [saved, setSaved] = useState(0);
  const [rated, setRated] = useState(false);

  useEffect(() => {
    const valid = [...TOPICS.map((t) => t.id), 'ecg'];
    setDue(getDueIds(valid).length);
    setSaved(getSavedIds().length);
    try {
      const ratings = (STUDENT_LEARNING as unknown as { read(): { ratings: Record<string, unknown> } }).read().ratings;
      setRated(Object.keys(ratings).length > 0);
    } catch {
      setRated(false);
    }
  }, []);

  if (!rated) return null;

  return (
    <section className="study-dashboard study-dashboard-compact" aria-label="Personal study tools">
      <div className="study-stats">
        <Link className="study-stat" href="/study/due">
          <strong>{due}</strong>
          <span>due now</span>
        </Link>
        <Link className="study-stat" href="/study/saved">
          <strong>{saved}</strong>
          <span>saved topics</span>
        </Link>
        <Link className="study-stat" href="/study/case">
          <strong>Practice</strong>
          <span>Work through a case</span>
        </Link>
      </div>
    </section>
  );
}

export default function HomePage(): JSX.Element {
  const { severity, patient, setPatient } = useChrome();
  useDocTitle(null);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [badges, setBadges] = useState<Record<string, { reviewed: string | null; saved: boolean }>>({});
  const [offline, setOffline] = useState('…');

  useEffect(() => {
    setOffline('serviceWorker' in navigator ? 'Works offline' : 'Online access');
    const store = readLearningStore();
    setReviewedCount(Object.keys(store.reviewed).filter((id) => store.reviewed[id]).length);
    const next: Record<string, { reviewed: string | null; saved: boolean }> = {};
    for (const t of TOPICS) {
      next[t.id] = {
        reviewed: store.reviewed[t.id] ? reviewLabelFor(t.id, store) : null,
        saved: !!store.saved[t.id],
      };
    }
    setBadges(next);
  }, [severity, patient]);

  const matchesSeverity = (id: string): boolean => {
    const cp = TOPIC_BY_ID[id];
    if (!cp) return false;
    if (severity === 'all') return true;
    return cp.dontMiss.some((d) => d[1] === severity);
  };
  const matchesPatient = (id: string): boolean =>
    patient === 'all' || (PATIENT_CONTEXTS[patient] ?? []).includes(id);

  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.ids.map((id) => TOPIC_BY_ID[id]).filter((t) => t && matchesSeverity(t.id) && matchesPatient(t.id)),
  })).filter((g) => g.items.length > 0);
  const visibleCount = TOPICS.filter((t) => matchesSeverity(t.id) && matchesPatient(t.id)).length;

  const severityCount = (id: string): number => {
    const cp = TOPIC_BY_ID[id];
    if (!cp) return 0;
    return cp.dontMiss.filter((d) => (severity === 'all' ? d[1] === 'critical' : d[1] === severity)).length;
  };
  const sevLabel = severity === 'all' ? 'critical' : severity;

  return (
    <>
      <section className="home-intro">
        <span className="study-kicker">EM POCKET · EMERGENCY MEDICINE</span>
        <h1>Build your clinical reasoning</h1>
        <p>Structured emergency medicine frameworks, ECG mastery, and simulated clinical practice.</p>
        <div className="home-actions">
          <button
            type="button"
            className="home-start"
            data-browse-library="1"
            onClick={() => {
              const library = document.getElementById('presentationLibrary');
              if (library) {
                (library as HTMLElement).focus({ preventScroll: true });
                library.scrollIntoView({ block: 'start', behavior: 'smooth' });
              }
            }}
          >
            Browse presentations <span aria-hidden="true">↓</span>
          </button>
          <Link className="home-ecg" id="ecgEntryBtn" href="/ecg">
            Learn ECGs <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="home-meta">
          <span>{TOPICS.length} presentations</span>
          <span>{reviewedCount} reviewed</span>
          <span id="offlineStatus">{offline}</span>
        </div>
      </section>
      <section className="presentation-library" id="presentationLibrary" aria-labelledby="presentationLibraryTitle" tabIndex={-1}>
        <div className="library-head">
          <div>
            <h2 id="presentationLibraryTitle">Presentation library</h2>
            <p>{visibleCount} of {TOPICS.length} presentations · grouped by clinical system</p>
          </div>
          <details className="library-filters" open={patient !== 'all'}>
            <summary>Filter by patient context{patient !== 'all' ? ' · active' : ''}</summary>
            <div className="patient-filter" role="group" aria-label="Patient context filter">
              <span>Patient context</span>
              {PATIENT_FILTERS.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={`patient-chip${patient === id ? ' active' : ''}`}
                  data-patient={id}
                  aria-pressed={patient === id}
                  onClick={() => setPatient(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </details>
          <details className="context-filters">
            <summary>Filter</summary>
            <SeverityChips />
          </details>
        </div>
        {groups.length ? (
          groups.map((g) => (
            <section className="home-group" key={g.title}>
              <h3 className="group-title">
                {g.title} <span>{g.items.length}</span>
              </h3>
              <div className="cp-grid">
                {g.items.map((cp) => (
                  <Link key={cp!.id} className="cp-card" href={`/topic/${cp!.id}`}>
                    <span className="cp-count">
                      {severityCount(cp!.id)} {sevLabel}
                    </span>
                    <TopicIcon id={cp!.id} />
                    <h3>{cp!.name}</h3>
                    <p>{cp!.tag}</p>
                    {badges[cp!.id]?.reviewed ? <span className="cp-reviewed">✓ {badges[cp!.id].reviewed}</span> : null}
                    {badges[cp!.id]?.saved ? <span className="cp-saved">★ Saved</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          ))
        ) : (
          <p className="empty-filter">No presentations match these filters. Try another patient context or severity.</p>
        )}
      </section>
      <StudyDashboard />
      <StudyStarter />
      <WorkspaceEntry />
    </>
  );
}
