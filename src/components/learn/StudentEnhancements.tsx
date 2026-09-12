'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { STUDENT_LEARNING } from '@/lib/learn/studentLearning';
import { GLOSSARY } from '@/data/glossary';

interface StudentApi {
  remember(route: string): void;
  getFocus(): string;
  setFocus(value: string): boolean;
  guidedHtml(id: string): string;
}

const api = STUDENT_LEARNING as unknown as StudentApi;

export function StudentIntro({ topicId }: { topicId: string }): JSX.Element {
  useEffect(() => {
    try {
      api.remember(topicId);
    } catch {
      /* Progress memory is best-effort. */
    }
  }, [topicId]);

  return (
    <section className="student-intro">
      <div className="student-actions">
        <strong>Learn</strong>
        <Link href={`/shift/${topicId}`}>Quick reference</Link>
        <Link href="/study/learn/practice">Clinical practice</Link>
      </div>
      <p>
        <strong>Your objective:</strong> explain the approach, recognize important warning signs, then test your recall.
      </p>
      <details className="student-glossary">
        <summary>Abbreviations explained</summary>
        <dl>
          {Object.entries(GLOSSARY).map(([abbr, full]) => (
            <div key={abbr}>
              <dt>{abbr}</dt>
              <dd>{full}</dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}

export function GuidedReasoning({ topicId }: { topicId: string }): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState('');

  useEffect(() => {
    try {
      setHtml(api.guidedHtml(topicId));
    } catch {
      setHtml('');
    }
  }, [topicId]);

  const onClick = (e: React.MouseEvent): void => {
    const button = (e.target as Element).closest?.('[data-learning-focus]') as HTMLElement | null;
    if (!button || !hostRef.current) return;
    const value = button.dataset.learningFocus ?? '';
    let ok = false;
    try {
      ok = api.setFocus(value);
    } catch {
      ok = false;
    }
    hostRef.current.querySelectorAll('[data-learning-focus]').forEach((b) => {
      b.setAttribute('aria-pressed', String(b === button));
    });
    const label = hostRef.current.querySelector('[data-focus-label]');
    if (label) label.textContent = button.textContent ?? value;
    let next = '';
    try {
      next = api.guidedHtml(topicId);
    } catch {
      next = '';
    }
    const body = hostRef.current.querySelector('[data-focus-body]');
    if (body) {
      const tmp = document.createElement('div');
      tmp.innerHTML = next;
      body.innerHTML = tmp.querySelector('[data-focus-body]')?.innerHTML ?? '';
    }
    const save = hostRef.current.querySelector('.guided-save');
    if (save) {
      save.textContent = ok ? 'Learning depth remembered on this device.' : 'Learning depth remembered for this session only.';
    }
  };

  if (!html) return <></>;
  return (
    <div ref={hostRef} onClick={onClick}>
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
