import { TOPICS } from '@/data/topics';
import { ECG_GUIDE } from '@/data/ecgGuide';
import { ECG_FIGURE_INDEX } from '@/data/ecgFigureIndex';
import { EXPLORER_INDEX } from '@/data/explorerIndex';
import { EM_LEARNING_DATA } from '@/data/emLearning';
import { STUDENT_CASES } from '@/data/studentCases';
import { LEARNING_VISUALS } from '@/lib/learn/topicAids';
import type { SearchResultItem } from '@/types';

export interface SearchIndex {
  items: SearchResultItem[];
}

let cached: SearchIndex | null = null;

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, ' ');
}

/**
 * Client-side search index (legacy `buildSearchIndex` parity in `assets/app.js`):
 * presentations, ECG guide entries, ECG figures, explorer cases, learning items.
 *
 * Loaded lazily (dynamic import from the search box) so the ECG/guide data
 * chains don't inflate the initial page bundle.
 */
export function buildSearchIndex(): SearchIndex {
  if (cached) return cached;
  const items: SearchResultItem[] = [];
  for (const cp of TOPICS) {
    items.push({ cpId: cp.id, target: 'how-to-think', title: cp.name, sub: cp.tag, kind: 'Presentation' });
    for (const s of cp.approach) {
      items.push({ cpId: cp.id, target: 'how-to-think', title: s, sub: `Approach — ${cp.name}`, kind: 'Approach' });
    }
    for (const d of cp.dontMiss) {
      items.push({ cpId: cp.id, target: 'dont-miss', title: d[0], sub: d[2], kind: `${cp.name} · ${d[1]}` });
    }
    for (const r of cp.redFlags) {
      items.push({ cpId: cp.id, target: 'red-flags', title: r, sub: `Red flag — ${cp.name}`, kind: 'Red flag' });
    }
    for (const h of cp.history) {
      items.push({ cpId: cp.id, target: 'history', title: h, sub: `Focused history — ${cp.name}`, kind: 'History' });
    }
    for (const e of cp.exam) {
      items.push({ cpId: cp.id, target: 'exam', title: e, sub: `Examination — ${cp.name}`, kind: 'Exam' });
    }
    for (const group of cp.workup) {
      for (const item of group[1]) {
        items.push({ cpId: cp.id, target: 'workup', title: item, sub: `${group[0]} — ${cp.name}`, kind: 'Workup' });
      }
    }
    for (const item of cp.disposition) {
      items.push({ cpId: cp.id, target: 'disposition', title: item[0], sub: `${item[1]} — ${cp.name}`, kind: 'Disposition' });
    }
    for (const p of cp.pitfalls) {
      items.push({ cpId: cp.id, target: 'pearls-pitfalls', title: p, sub: `Pitfall — ${cp.name}`, kind: 'Pitfall' });
    }
    for (const p of cp.pearls ?? []) {
      items.push({ cpId: cp.id, target: 'pearls-pitfalls', title: p, sub: `Pearl — ${cp.name}`, kind: 'Pearl' });
    }
  }
  const ecg = ECG_GUIDE;
  items.push({ cpId: 'ecg', target: '', title: 'ECG Guide', sub: ecg.tag, kind: 'ECG' });
  items.push({ cpId: 'ecg', target: '', title: ecg.title, sub: ecg.subtitle ?? ecg.tag, kind: 'ECG' });
  for (const s of ecg.firstPass) {
    items.push({ cpId: 'ecg', target: 'ecg-how', title: s, sub: 'ECG first-pass', kind: 'ECG' });
  }
  for (const s of ecg.steps) {
    items.push({ cpId: 'ecg', target: `step-${s.id}`, title: `Step ${s.num}: ${s.name}`, sub: s.summary, kind: 'ECG step' });
    if (s.pearl) items.push({ cpId: 'ecg', target: `step-${s.id}`, title: s.pearl, sub: `${s.name} · pearl`, kind: 'ECG step' });
    if (s.pitfall) items.push({ cpId: 'ecg', target: `step-${s.id}`, title: s.pitfall, sub: `${s.name} · pitfall`, kind: 'ECG step' });
  }
  for (const p of ecg.patterns) {
    items.push({ cpId: 'ecg', target: p.id, title: p.name, sub: stripTags(p.criteria), kind: 'ECG pattern' });
    if (p.tag) items.push({ cpId: 'ecg', target: p.id, title: p.tag, sub: p.name, kind: 'ECG pattern' });
  }
  for (const r of ecg.redFlags) {
    items.push({ cpId: 'ecg', target: 'ecg-red-flags', title: r, sub: 'ECG red flag', kind: 'ECG' });
  }
  for (const p of ecg.pearls) {
    items.push({ cpId: 'ecg', target: 'pearls-pitfalls', title: p, sub: 'ECG pearl', kind: 'ECG' });
  }
  for (const p of ecg.pitfalls) {
    items.push({ cpId: 'ecg', target: 'pearls-pitfalls', title: p, sub: 'ECG pitfall', kind: 'ECG' });
  }
  for (const [id, fig] of Object.entries(ECG_FIGURE_INDEX)) {
    items.push({
      cpId: 'ecg',
      target: `fig:${id}`,
      title: fig.title,
      sub: `ECG figure · ${fig.caption.slice(0, 200)}`,
      kind: 'ECG figure',
    });
  }
  for (const c of EXPLORER_INDEX) {
    items.unshift({
      cpId: 'ecg-explorer',
      target: c.id,
      title: c.name,
      sub: `${c.category} · ${c.id.replace(/-/g, ' ')} · ${c.summary}`,
      kind: 'Interactive ECG',
    });
  }
  for (const c of EM_LEARNING_DATA.cases) {
    items.unshift({ cpId: 'learn', target: `case-${String(c.id)}`, title: String(c.title), sub: `${String(c.domain)} evolving case`, kind: 'Practice' });
  }
  for (const m of EM_LEARNING_DATA.modules) {
    items.unshift({ cpId: 'learn', target: `module-${String(m.id)}`, title: String(m.title), sub: String(m.kind), kind: 'Skills' });
  }
  for (const [id, title, text] of LEARNING_VISUALS) {
    items.unshift({ cpId: 'learn', target: `visual-${id}`, title, sub: text, kind: 'Visual learning' });
  }
  items.unshift({
    cpId: 'learn',
    target: 'progress',
    title: 'Export or import learning backup',
    sub: 'Progress, saved notes and preferences',
    kind: 'My progress',
  });
  for (const c of STUDENT_CASES) {
    items.unshift({
      cpId: 'study',
      target: `case-${c.id}`,
      title: c.title,
      sub: c.stem.slice(0, 160),
      kind: 'Practice case',
    });
  }
  cached = { items };
  return cached;
}

/** Legacy `runSearch` parity: substring match, title-quality sort, max 12 hits. */
export function searchIndex(query: string, limit = 12): SearchResultItem[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const { items } = buildSearchIndex();
  const score = (title: string): number => {
    const t = title.toLowerCase();
    if (t === q) return 100;
    if (t.startsWith(q) && (!t[q.length] || /[^a-z0-9]/.test(t[q.length]))) return 80;
    if (t.includes(q)) return 40;
    return 20;
  };
  return items
    .filter((x) => x.title.toLowerCase().includes(q) || (x.sub && x.sub.toLowerCase().includes(q)))
    .sort((a, b) => score(b.title) - score(a.title))
    .slice(0, limit);
}
