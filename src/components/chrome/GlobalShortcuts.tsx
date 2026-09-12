'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { GROUPS } from '@/lib/libraryMeta';
import { getTopic } from '@/data/topics';
import { ECG_GUIDE } from '@/data/ecgGuide';

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
  return out;
}

/** Global keyboard shortcuts (legacy parity): H home, S practice, E ECG guide, V shift view, [ ] prev/next topic. */
export default function GlobalShortcuts(): null {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el?.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (document.querySelector('.disclaimer-overlay')) return;
      const path = window.location.pathname;
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        router.push('/');
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        router.push('/study/learn/practice');
      } else if ((e.key === 'e' || e.key === 'E') && !path.startsWith('/explorer')) {
        e.preventDefault();
        router.push('/ecg');
      } else if (e.key === 'v' || e.key === 'V') {
        e.preventDefault();
        const m = path.match(/^\/topic\/([a-z0-9-]+)/);
        router.push(m ? `/shift/${m[1]}` : '/shift');
      } else if (e.key === '[' || e.key === ']') {
        if (path === '/ecg' || path === '/ecg/') {
          // Step through the 7-step ECG method (legacy `[`/`]` parity).
          const ids = ECG_GUIDE.steps.map((s) => `ecg-step-${s.id}`);
          const hash = window.location.hash.replace(/^#section-/, '');
          let idx = ids.indexOf(hash);
          idx = e.key === ']' ? (idx < 0 ? 0 : Math.min(ids.length - 1, idx + 1)) : idx < 0 ? 0 : Math.max(0, idx - 1);
          e.preventDefault();
          window.location.hash = `section-${ids[idx]}`;
          return;
        }
        const m = path.match(/^\/topic\/([a-z0-9-]+)/);
        if (!m) return;
        const ids = orderedIds();
        const i = ids.indexOf(m[1]);
        if (i < 0) return;
        const next = e.key === ']' ? ids[i + 1] : ids[i - 1];
        if (next) {
          e.preventDefault();
          router.push(`/topic/${next}`);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [router]);

  return null;
}
