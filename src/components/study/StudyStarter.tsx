'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { STUDENT_LEARNING } from '@/lib/learn/studentLearning';
import { getTopic } from '@/data/topics';
import { getExplorerCases } from '@/lib/ecg/api';

interface Ratings {
  ratings: Record<string, { value: string; at: number }>;
  last: string;
}

const api = STUDENT_LEARNING as unknown as {
  read(): Ratings;
  remember(route: string): void;
};

function weakHref(key: string): { href: string; label: string; state: string } | null {
  const value = api.read().ratings[key];
  if (!value) return null;
  const id = key.split(':')[1];
  const state = value.value === 'again' ? 'Review again' : 'Partly confident';
  if (key.startsWith('ecg:')) {
    const found = getExplorerCases().find((c) => c.id === id);
    if (!found) return null;
    return { href: `/explorer/${id}`, label: found.name, state };
  }
  if (key.startsWith('case:')) {
    return { href: `/study/case/${id}`, label: id, state };
  }
  const topic = getTopic(id);
  if (!topic) return null;
  return { href: `/topic/${id}#section-study`, label: topic.name, state };
}

function lastHref(last: string): string {
  if (/^(?:ecg(?:-explorer)?|[a-z-]+)(?:~[a-z0-9-]+)?$/.test(last)) {
    const [id, target] = last.split('~');
    if (id === 'ecg-explorer') return target ? `/explorer/${target}` : '/explorer';
    if (id === 'ecg') return '/ecg';
    if (id === 'study') return `/study/${target ?? 'due'}`;
    if (id === 'learn') return '/study/learn/practice';
    if (id === 'shift') return target ? `/shift/${target}` : '/shift';
    return target ? `/topic/${id}#section-${target}` : `/topic/${id}`;
  }
  return '/';
}

/**
 * Recommended learning track + weak-area revisit list.
 * (Legacy `starterHtml` parity from `assets/student-learning.js`.)
 */
export default function StudyStarter(): JSX.Element | null {
  const [ratings, setRatings] = useState<Ratings>({ ratings: {}, last: '' });

  useEffect(() => {
    try {
      setRatings(api.read());
    } catch {
      setRatings({ ratings: {}, last: '' });
    }
  }, []);

  const weak = Object.entries(ratings.ratings)
    .filter(([, v]) => v && v.value !== 'got')
    .sort((a, b) => b[1].at - a[1].at);
  const last = ratings.last;

  return (
    <section className="student-start">
      <p className="study-kicker">RECOMMENDED FOR NEW LEARNERS</p>
      <h2>{last ? 'Resume your learning session' : '10-minute foundational track'}</h2>
      <p>Learn a core clinical approach, inspect a normal tracing, then make your first decision.</p>
      <div className="student-actions">
        {last ? <Link href={lastHref(last)}>Continue where you left off →</Link> : null}
        <Link href="/topic/chest-pain">1 · Learn Chest Pain approach</Link>
        <Link href="/explorer/normal">2 · Read normal 12-lead ECG</Link>
        <Link href="/study/case">3 · Test with ACS case</Link>
      </div>
      {weak.length ? (
        <details className="weak-areas">
          <summary>Revisit your weak areas ({weak.length})</summary>
          <ul>
            {weak.map(([key]) => {
              const w = weakHref(key);
              if (!w) return null;
              return (
                <li key={key}>
                  <Link href={w.href}>{w.label}</Link> · {w.state}
                </li>
              );
            })}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
