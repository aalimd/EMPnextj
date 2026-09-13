import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = path.join(root, 'assets');
const outDir = path.join(root, 'src', 'generated');

function makeSandbox() {
  const store = new Map();
  const window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({ matches: false, addEventListener: () => {} }),
  };
  const sandbox = {
    window,
    self: {},
    document: {
      readyState: 'complete',
      addEventListener: () => {},
      getElementById: () => null,
      createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
      querySelector: () => null,
      querySelectorAll: () => [],
      body: { appendChild: () => {} },
    },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => { store.set(k, v); },
      removeItem: (k) => { store.delete(k); },
    },
    navigator: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    requestAnimationFrame: (fn) => 0,
    console,
    Math,
    JSON,
    Object,
    Array,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    Error,
    Set,
    Map,
    Promise,
    URL,
  };
  sandbox.window = sandbox;
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function loadFile(sandbox, file) {
  const code = fs.readFileSync(path.join(assetsDir, file), 'utf8');
  vm.runInContext(code, sandbox, { filename: file });
}

// Load order mirrors index.html (data before logic; engine before curriculum/explorer)
const files = [
  'ecg-svg.js',
  'ecg-engine.js',
  'ecg-case-tracings.js',
  'ecg-interactive.js',
  'ecg-curriculum.js',
  'ecg-explorer.js',
  'data.js',
  'evidence.js',
  'student-learning.js',
  'em-learning-data.js',
  'ecg-recordings.js',
  'em-learning.js',
];

const sandbox = makeSandbox();
for (const f of files) {
  try {
    loadFile(sandbox, f);
    console.log('loaded', f);
  } catch (e) {
    console.error('FAILED', f, String(e).slice(0, 500));
  }
}

const snap = {
  cpCount: Array.isArray(sandbox.CP_DATA) ? sandbox.CP_DATA.length : 0,
  cpIds: Array.isArray(sandbox.CP_DATA) ? sandbox.CP_DATA.map((c) => c.id) : [],
  evidenceChecked: sandbox.CLINICAL_EVIDENCE?.checked ?? null,
  ECG_SVG_KEYS: sandbox.ECG_SVG ? Object.keys(sandbox.ECG_SVG) : [],
  ECG_CURRICULUM_CASES: sandbox.ECG_CURRICULUM?.cases?.length ?? 0,
  ECG_EXPLORER_CASES: sandbox.ECG_EXPLORER?.cases?.length ?? 0,
  EM_LEARNING_DATA_KEYS: sandbox.EM_LEARNING_DATA ? Object.keys(sandbox.EM_LEARNING_DATA) : [],
  STUDENT_CASES: sandbox.STUDENT_LEARNING?.cases?.length ?? null,
  ENGINE_VERSION: sandbox.ECG_ENGINE?.version ?? null,
};
console.log(JSON.stringify(snap, null, 2));

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(snap, null, 2));

// Full dumps for byte-exact TS generation (verbatim, no medical edits).
// Only live sources are dumped; transient snapshots (full SVG library,
// curriculum cases) are verified at migration time, not stored.
function dump(name, value) {
  fs.writeFileSync(path.join(outDir, name + '.json'), JSON.stringify(value));
  console.log('dumped', name, JSON.stringify(value ?? null).length, 'chars');
}
dump('CP_DATA', sandbox.CP_DATA);
dump('ECG_DATA', sandbox.ECG_DATA);
dump('CLINICAL_EVIDENCE', sandbox.CLINICAL_EVIDENCE);
dump('EM_LEARNING_DATA', sandbox.EM_LEARNING_DATA);
dump('ECG_EXPLORER_CASES', sandbox.ECG_EXPLORER?.cases ?? null);
dump('STUDENT_CASES', sandbox.STUDENT_LEARNING?.cases ?? null);

// Lightweight figure title/caption index (search + links without the engine).
const svgLib = sandbox.ECG_SVG ?? {};
const figureIndex = Object.fromEntries(
  Object.entries(svgLib).map(([id, entry]) => [
    id,
    {
      title: typeof entry.title === 'string' ? entry.title : id,
      caption: typeof entry.caption === 'string' ? entry.caption : '',
    },
  ]),
);
fs.writeFileSync(path.join(outDir, 'ECG_FIGURE_INDEX.json'), JSON.stringify(figureIndex));
console.log('dumped ECG_FIGURE_INDEX', Object.keys(figureIndex).length, 'figures');
