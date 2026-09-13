import type { SearchResultItem } from '@/types';

/** Maps a search result to its Next.js route (replaces legacy hash navigation). */
export function resultHref(r: SearchResultItem): string {
  if (r.cpId === 'ecg') {
    if (!r.target) return '/ecg';
    if (r.target.startsWith('fig:')) return `/ecg/${r.target.slice(4)}`;
    if (r.target.startsWith('step-')) return `/ecg#section-ecg-${r.target}`;
    if (r.target === 'ecg-how' || r.target === 'ecg-red-flags' || r.target === 'pearls-pitfalls') {
      return `/ecg#section-${r.target}`;
    }
    return `/ecg#section-ecg-pattern-${r.target}`;
  }
  if (r.cpId === 'ecg-explorer') return r.target ? `/explorer/${r.target}` : '/explorer';
  if (r.cpId === 'learn') {
    const t = r.target || 'practice';
    if (t.startsWith('case-')) return `/study/learn/case/${t.slice(5)}`;
    if (t.startsWith('module-')) return `/study/learn/module/${t.slice(7)}`;
    if (t.startsWith('visual-')) return `/study/learn/visual/${t.slice(7)}`;
    return `/study/learn/${t}`;
  }
  if (r.cpId === 'study') {
    const t = r.target || 'case';
    if (t === 'case') return '/study/case';
    if (t.startsWith('case-')) return `/study/case/${t.slice(5)}`;
    return `/study/${t}`;
  }
  if (r.cpId === 'shift') return r.target ? `/shift/${r.target}` : '/shift';
  return r.target ? `/topic/${r.cpId}#section-${r.target}` : `/topic/${r.cpId}`;
}
