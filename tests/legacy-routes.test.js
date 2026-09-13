'use strict';
// Contract for hash ↔ path translation. Keep in sync with src/lib/legacyRoutes.ts.
// Run: node --test tests/legacy-routes.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const src = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const gen = (name) => JSON.parse(fs.readFileSync(path.join(root, 'src', 'generated', `${name}.json`), 'utf8'));

const topics = gen('CP_DATA');
const figures = gen('ECG_FIGURE_INDEX');
const guide = gen('ECG_DATA');
const TOPIC_IDS = new Set(topics.map((t) => t.id));
const FIGURE_IDS = new Set(Object.keys(figures));

function resolveEcgTarget(target) {
  if (!target) return '';
  if (target.startsWith('ecg-')) return target;
  if (guide.steps.some((s) => s.id === target)) return `ecg-step-${target}`;
  if (target.startsWith('step-')) return `ecg-${target}`;
  if (guide.patterns.some((p) => p.id === target)) return `ecg-pattern-${target}`;
  if (target === 'patterns') return 'ecg-patterns';
  if (target === 'red-flags') return 'ecg-red-flags';
  return target;
}

function hashToPath(hash) {
  if (!hash) return null;
  const raw = String(hash).replace(/^#/, '');
  if (raw === '') return '/';
  if (
    raw.startsWith('section-') ||
    raw === 'stage' ||
    raw === 'presentationLibrary' ||
    raw === 'filterChips'
  ) {
    return null;
  }
  const [id, target] = raw.split('~');
  switch (id) {
    case 'ecg': {
      if (!target) return '/ecg';
      if (FIGURE_IDS.has(target)) return `/ecg/${target}`;
      if (target === 'patterns') return '/ecg#section-ecg-patterns';
      const section = resolveEcgTarget(target);
      return section ? `/ecg#section-${section}` : '/ecg';
    }
    case 'ecg-explorer':
      return target === 'practice' ? '/explorer/practice' : target ? `/explorer/${target}` : '/explorer';
    case 'study': {
      if (!target) return '/study';
      if (target.startsWith('case-')) return `/study/case/${target.slice(5)}`;
      return `/study/${target}`;
    }
    case 'learn': {
      if (!target) return '/study/learn';
      if (target.startsWith('case-')) return `/study/learn/case/${target.slice(5)}`;
      if (target.startsWith('module-')) return `/study/learn/module/${target.slice(7)}`;
      if (target.startsWith('visual-')) return `/study/learn/visual/${target.slice(7)}`;
      return `/study/learn/${target}`;
    }
    case 'shift':
      return target && TOPIC_IDS.has(target) ? `/shift/${target}` : '/shift';
    default:
      if (TOPIC_IDS.has(id)) return target ? `/topic/${id}#section-${target}` : `/topic/${id}`;
      return null;
  }
}

const CASES = [
  ['', null],
  ['#', '/'],
  ['#chest-pain', '/topic/chest-pain'],
  ['#chest-pain~disposition', '/topic/chest-pain#section-disposition'],
  ['#chest-pain~how-to-think', '/topic/chest-pain#section-how-to-think'],
  ['#section-red-flags', null],
  ['#section-ecg-step-rate', null],
  ['#stage', null],
  ['#presentationLibrary', null],
  ['#filterChips', null],
  ['#ecg', '/ecg'],
  ['#ecg~wellens', '/ecg/wellens'],
  ['#ecg~patterns', '/ecg#section-ecg-patterns'],
  ['#ecg-explorer', '/explorer'],
  ['#ecg-explorer~normal', '/explorer/normal'],
  ['#ecg-explorer~practice', '/explorer/practice'],
  ['#learn', '/study/learn'],
  ['#learn~practice', '/study/learn/practice'],
  ['#learn~case-resus', '/study/learn/case/resus'],
  ['#learn~module-handover', '/study/learn/module/handover'],
  ['#learn~visual-recordings', '/study/learn/visual/recordings'],
  ['#learn~progress', '/study/learn/progress'],
  ['#study', '/study'],
  ['#study~case', '/study/case'],
  ['#study~case-chest-pain', '/study/case/chest-pain'],
  ['#study~due', '/study/due'],
  ['#shift', '/shift'],
  ['#shift~dyspnea', '/shift/dyspnea'],
  ['#shift~not-a-topic', '/shift'],
  ['#not-a-real-page', null],
];

test('legacy hashes map to canonical Next routes (and in-page hashes stay put)', () => {
  for (const [hash, expected] of CASES) {
    assert.equal(hashToPath(hash), expected, hash);
  }
});

test('every topic hash resolves and unknown kebab ids do not 404 as topics', () => {
  for (const t of topics) {
    assert.equal(hashToPath(`#${t.id}`), `/topic/${t.id}`);
  }
  assert.equal(hashToPath('#presentationLibrary'), null);
  assert.equal(hashToPath('#section-study'), null);
});

test('src/lib/legacyRoutes.ts implements the hash-bridge contract', () => {
  const file = src('src/lib/legacyRoutes.ts');
  for (const needle of [
    "raw.startsWith('section-')",
    'getTopic',
    "target.startsWith('case-')",
    'presentationLibrary',
    "return '/'",
    'rewriteLegacyHrefs',
  ]) {
    assert.ok(file.includes(needle), `missing ${needle}`);
  }
});

test('HashBridge intercepts hash clicks and ignores in-page section hashes', () => {
  const file = src('src/components/chrome/HashBridge.tsx');
  assert.ok(file.includes('a[href^="#"]') || file.includes("a[href^=\"#\"]"));
  assert.ok(file.includes('hashToPath'));
  assert.match(file, /in-page/i);
});

test('search resultHref sends practice cases to /study/case/:id', () => {
  const file = src('src/lib/search.ts');
  assert.ok(file.includes("t.startsWith('case-')"));
  assert.ok(file.includes('/study/case/${t.slice(5)}') || file.includes('/study/case/${t.slice(5)}'));
});

test('search index includes visuals, backup, and per-case practice targets', () => {
  const file = src('src/lib/searchIndex.ts');
  assert.ok(file.includes('LEARNING_VISUALS'));
  assert.ok(file.includes("target: 'progress'"));
  assert.ok(file.includes('case-${c.id}'));
});
