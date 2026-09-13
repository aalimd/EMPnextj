'use strict';
// Migration parity: migrated data snapshots stay faithful to the legacy source.
// Run: node --test tests/migration-parity.test.js
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const gen = (name) => JSON.parse(fs.readFileSync(path.join(root, 'src', 'generated', `${name}.json`), 'utf8'));
const src = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('clinical library intact: 45 topics, valid shapes and severities', () => {
  const topics = gen('CP_DATA');
  assert.equal(topics.length, 45);
  for (const t of topics) {
    assert.match(t.id, /^[a-z0-9-]+$/);
    for (const f of ['name', 'icon', 'tag', 'overview']) assert.equal(typeof t[f], 'string', t.id);
    for (const f of ['approach', 'history', 'exam', 'redFlags', 'pitfalls', 'refs']) assert.ok(Array.isArray(t[f]), `${t.id}.${f}`);
    for (const d of t.dontMiss) assert.ok(['critical', 'emergent', 'common'].includes(d[1]), `${t.id}:${d[0]}`);
  }
});

test('ECG guide intact: 7 steps, 18 patterns, figures resolve', () => {
  const guide = gen('ECG_DATA');
  assert.equal(guide.steps.length, 7);
  assert.equal(guide.patterns.length, 18);
  const figs = gen('ECG_FIGURE_INDEX');
  assert.equal(Object.keys(figs).length, 27);
  for (const s of guide.steps) assert.ok(figs[s.id]?.caption, `step figure ${s.id}`);
  for (const p of guide.patterns) assert.ok(figs[p.id]?.caption, `pattern figure ${p.id}`);
});

test('explorer index intact: 47 cases with guides and summaries', () => {
  const cases = gen('ECG_EXPLORER_CASES');
  assert.equal(cases.length, 47);
  assert.equal(new Set(cases.map((c) => c.id)).size, 47);
  for (const c of cases) {
    assert.ok(c.name && c.category && c.summary && c.guide, c.id);
  }
});

test('explorer patterns are all supported by the ported engine', () => {
  const engineSrc = src('src/lib/ecg/engine.ts');
  const supported = new Set([...engineSrc.matchAll(/case '([a-z-]+)':/g)].map((m) => m[1]));
  assert.ok(supported.has('normal-sinus') && supported.has('atrial-fibrillation'));
  for (const c of gen('ECG_EXPLORER_CASES')) {
    if (c.pattern) assert.ok(supported.has(c.pattern), `${c.id} -> ${c.pattern}`);
  }
});

test('learning data intact: 12 short cases, 6 evolving cases, 6 modules', () => {
  const short = gen('STUDENT_CASES');
  assert.equal(short.length, 12);
  for (const c of short) {
    assert.ok(c.questions.length >= 2, c.id);
    for (const q of c.questions) {
      assert.equal(q.options.filter((o) => o.correct).length, 1, c.id);
    }
  }
  const em = gen('EM_LEARNING_DATA');
  assert.equal(em.cases.length, 6);
  assert.equal(em.modules.length, 6);
});

test('client localStorage keys are a subset of legacy keys (no cross-app leakage)', () => {
  const legacyKeys = new Set();
  for (const file of ['assets/app.js', 'assets/student-learning.js', 'assets/em-learning.js', 'assets/ecg-explorer.js', 'index.html']) {
    const text = src(file);
    for (const m of text.matchAll(/localStorage\.(?:get|set)Item\('([^']+)'/g)) legacyKeys.add(m[1]);
    for (const m of text.matchAll(/['"]((?:em-cps|em-student|em-ecg|em-workspace|em-learning)-[^'"]+)['"]/g)) {
      legacyKeys.add(m[1]);
    }
  }
  assert.ok(legacyKeys.has('em-cps-prefs') && legacyKeys.has('em-cps-learning') && legacyKeys.has('em-cps-disclaimer-agreed'));
  const files = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!p.startsWith('src/lib/ecg') && !p.startsWith('src/lib/learn')) walk(p); }
      else if (p.endsWith('.ts') || p.endsWith('.tsx')) files.push(p);
    }
  };
  walk('src/app');
  walk('src/components');
  walk('src/lib');
  const used = new Set();
  for (const f of files) {
    for (const m of src(f).matchAll(/localStorage\.(?:get|set)Item\('([^']+)'/g)) used.add(m[1]);
  }
  assert.ok(used.size > 0);
  for (const k of used) assert.ok(legacyKeys.has(k), `new localStorage key not in legacy set: ${k}`);
  for (const k of used) assert.ok(!k.startsWith('em-p-'), `paid-app key used: ${k}`);
});

test('learning visuals list matches the workspace engine', () => {
  const em = src('src/lib/learn/emLearning.ts');
  const m = em.match(/const visuals=(\[[\s\S]*?\]);/);
  assert.ok(m, 'visuals array in emLearning.ts');
  const engine = new Function(`return (${m[1]})`)();
  const aids = src('src/lib/learn/topicAids.ts');
  for (const [id, title] of engine) {
    assert.ok(aids.includes(`'${id}'`), `topicAids missing visual ${id}`);
    assert.ok(aids.includes(title), `topicAids missing title ${title}`);
  }
  assert.equal(engine.length, 5);
});

test('disclaimer bootstrap hides the app until the educational notice is agreed', () => {
  const layout = src('src/app/layout.tsx');
  assert.ok(layout.includes("data-disclaimer"));
  assert.ok(layout.includes('em-cps-disclaimer-agreed'));
  const css = src('src/styles/globals.css');
  assert.ok(css.includes('html[data-disclaimer="pending"]'));
  const prefs = src('src/lib/preferences.tsx');
  assert.ok(prefs.includes("removeAttribute('data-disclaimer')"));
});

test('visual routes and PWA shortcuts match static-export trailing slashes', () => {
  const visualPage = src('src/app/study/learn/visual/[id]/page.tsx');
  assert.ok(visualPage.includes('LEARNING_VISUALS'));
  const manifest = JSON.parse(src('public/manifest.json'));
  for (const s of manifest.shortcuts) {
    assert.ok(s.url.startsWith('./'));
    assert.ok(s.url.endsWith('/'), s.url);
  }
});

test('every topic id has static route coverage and group membership', () => {
  const topics = gen('CP_DATA');
  const groups = tosGroups();
  const grouped = new Set(groups.flatMap((g) => g.ids));
  for (const t of topics) assert.ok(grouped.has(t.id), `ungrouped topic ${t.id}`);
  assert.ok(fs.existsSync(path.join(root, 'src', 'app', 'topic', '[id]', 'page.tsx')));
  assert.ok(fs.existsSync(path.join(root, 'src', 'app', 'explorer', '[caseId]', 'page.tsx')));
});

function tosGroups() {
  const lib = src('src/lib/libraryMeta.ts');
  const start = lib.indexOf('export const GROUPS');
  assert.ok(start >= 0, 'GROUPS export found');
  const eq = lib.indexOf('=', start);
  const open = lib.indexOf('[', eq);
  let depth = 0;
  let instr = null;
  let esc = false;
  for (let i = open; i < lib.length; i++) {
    const ch = lib[i];
    if (instr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === instr) instr = null;
    } else if (ch === "'" || ch === '"' || ch === '`') instr = ch;
    else if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) return new Function(`return (${lib.slice(open, i + 1)})`)();
    }
  }
  throw new Error('GROUPS literal unbalanced');
}
