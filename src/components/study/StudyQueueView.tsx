'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { TOPIC_BY_ID, getTopic } from '@/data/topics';
import { getDueIds, getSavedIds, readLearningStore, reviewLabelFor } from '@/lib/learning';
import { useDocTitle } from '@/lib/useDocTitle';
import TopicIcon from '@/components/library/TopicIcon';
import StudyStarter from './StudyStarter';

function TopicRow({ id }: { id: string }): JSX.Element {
  const [meta, setMeta] = useState('');
  const [noted, setNoted] = useState(false);
  const cp = TOPIC_BY_ID[id];
  const isEcg = id === 'ecg';

  useEffect(() => {
    const store = readLearningStore();
    setMeta(store.reviewed[id] ? reviewLabelFor(id, store) : 'Not yet reviewed');
    setNoted(!!store.notes[id]);
  }, [id]);

  if (isEcg) {
    return (
      <Link className="study-topic" href="/ecg">
        <span className="study-topic-ico" data-cat="ecg" aria-hidden="true">
          <TopicIcon id="ecg" side />
        </span>
        <div>
          <strong>Emergency ECG Guide</strong>
          <small>{meta}</small>
        </div>
        <b>→</b>
      </Link>
    );
  }
  if (!cp) return <></>;
  return (
    <Link className="study-topic" href={`/topic/${cp.id}`}>
      <span className="study-topic-ico" data-cat={cp.id} aria-hidden="true">
        <TopicIcon id={cp.id} side />
      </span>
      <div>
        <strong>{cp.name}</strong>
        <small>
          {meta}
          {noted ? ' · note saved' : ''}
        </small>
      </div>
      <b>→</b>
    </Link>
  );
}

export default function StudyQueueView({ view }: { view: 'due' | 'saved' }): JSX.Element {
  const [ids, setIds] = useState<string[]>([]);
  const [dueCount, setDueCount] = useState(0);
  useDocTitle('Study');

  useEffect(() => {
    const valid = [...Object.keys(TOPIC_BY_ID), 'ecg'];
    setDueCount(getDueIds(valid).length);
    if (view === 'due') {
      setIds(getDueIds(valid));
    } else {
      const saved = getSavedIds().filter((id) => TOPIC_BY_ID[id] || id === 'ecg');
      const topics = saved.filter((id) => getTopic(id));
      const rest = saved.filter((id) => !getTopic(id));
      setIds([...topics, ...rest]);
    }
  }, [view]);

  const empty =
    view === 'due'
      ? 'Nothing is due yet. Mark a topic reviewed to start its spaced-review schedule.'
      : 'No saved topics yet. Save one from any presentation.';

  return (
    <>
      <div className="workspace-actions study-workspace-links">
        <Link href="/study/learn/practice">Evolving cases →</Link>
        <Link href="/study/learn/progress">Progress &amp; backup →</Link>
        <Link href="/study/learn/skills">Procedures &amp; teams →</Link>
      </div>
      <nav className="study-tabs" aria-label="Study views">
        <Link href="/study/due" aria-current={view === 'due' ? 'page' : undefined} className={view === 'due' ? 'active' : ''}>
          Review queue <span>{dueCount}</span>
        </Link>
        <Link href="/study/saved" aria-current={view === 'saved' ? 'page' : undefined} className={view === 'saved' ? 'active' : ''}>
          Saved
        </Link>
        <Link href="/study/case">Practice case</Link>
      </nav>
      <section className="study-page">
        <div className="study-page-head">
          <Link href="/" className="back-btn" data-home="1">
            ← All presentations
          </Link>
          <span className="study-kicker">PERSONAL STUDY SPACE</span>
          <h1>{view === 'due' ? 'Review queue' : 'Saved topics'}</h1>
          <p>
            {view === 'due'
              ? 'Topics return after 1, 3, 7, and 14 days of review. Complete a review to move it to the next interval.'
              : 'Use saved topics for weak areas, upcoming rotations, or cases you want to discuss.'}
          </p>
        </div>
        {ids.length ? (
          <div className="study-topic-list">
            {ids.map((id) => (
              <TopicRow key={id} id={id} />
            ))}
          </div>
        ) : (
          <p className="study-empty">{empty}</p>
        )}
      </section>
      <StudyStarter />
    </>
  );
}
