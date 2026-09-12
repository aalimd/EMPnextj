'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { STUDENT_LEARNING } from '@/lib/learn/studentLearning';
import { STUDENT_CASES } from '@/data/studentCases';
import { useDocTitle } from '@/lib/useDocTitle';

const api = STUDENT_LEARNING as unknown as {
  render(index: number): string;
  bindPractice(root: Element): void;
};

/** Short clinical practice cases (legacy `caseHtml` + `bindPractice` parity). */
export default function StudyCaseView({ caseId }: { caseId?: string }): JSX.Element {
  const router = useRouter();
  const hostRef = useRef<HTMLDivElement>(null);
  const initial = caseId ? Math.max(0, STUDENT_CASES.findIndex((c) => c.id === caseId)) : 0;
  const [cursor, setCursor] = useState(initial);
  useDocTitle('Practice case');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let html = '';
    try {
      const n = STUDENT_CASES.length || 1;
      html = api.render(((cursor % n) + n) % n);
    } catch {
      html = '<p class="study-empty">Practice cases are unavailable right now.</p>';
    }
    host.innerHTML = html;
    try {
      api.bindPractice(host);
    } catch {
      /* binding is best-effort */
    }
    const onChange = (e: Event): void => {
      const sel = (e.target as Element).closest?.('[data-practice-case]') as HTMLSelectElement | null;
      if (sel) {
        const next = Number(sel.value);
        if (Number.isInteger(next)) {
          const target = STUDENT_CASES[((next % STUDENT_CASES.length) + STUDENT_CASES.length) % STUDENT_CASES.length];
          if (target && target.id !== caseId) router.push(`/study/case/${target.id}`);
          else setCursor(next);
        }
      }
    };
    const onClick = (e: Event): void => {
      const el = e.target as Element;
      if (el.closest?.('[data-next-case]')) {
        const next = cursor + 1;
        const target = STUDENT_CASES[((next % STUDENT_CASES.length) + STUDENT_CASES.length) % STUDENT_CASES.length];
        if (target) router.push(`/study/case/${target.id}`);
      } else if (el.closest?.('[data-retry-case]')) {
        setCursor((c) => c);
        const hostEl = hostRef.current;
        if (hostEl) {
          try {
            hostEl.innerHTML = api.render(cursor);
            api.bindPractice(hostEl);
          } catch {
            /* noop */
          }
        }
      }
    };
    host.addEventListener('change', onChange);
    host.addEventListener('click', onClick);
    return () => {
      host.removeEventListener('change', onChange);
      host.removeEventListener('click', onClick);
    };
  }, [cursor, caseId, router]);

  return (
    <>
      <div className="workspace-actions study-workspace-links">
        <Link href="/study/learn/practice">Evolving cases →</Link>
        <Link href="/study/learn/progress">Progress &amp; backup →</Link>
        <Link href="/study/learn/skills">Procedures &amp; teams →</Link>
      </div>
      <nav className="study-tabs" aria-label="Study views">
        <Link href="/study/due">Review queue</Link>
        <Link href="/study/saved">Saved</Link>
        <Link href="/study/case" aria-current="page" className="active">
          Practice case
        </Link>
      </nav>
      <div ref={hostRef} />
    </>
  );
}
