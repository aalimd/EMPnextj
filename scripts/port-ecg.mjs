/**
 * Mechanical verbatim port of legacy ECG scripts to TypeScript modules.
 *
 * - No clinical/morphology logic is altered: only the IIFE wrapper is removed,
 *   `window.*` globals become ES imports/exports, and browser-only top-level
 *   listeners are guarded for SSR.
 * - Ported files carry `// @ts-nocheck` (documented, isolated) because they
 *   preserve legacy untyped internals byte-for-byte. All NEW code (facades,
 *   components, routes) is fully strict-typed and consumes these modules
 *   through explicit interfaces in `src/lib/ecg/api.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'src', 'lib', 'ecg');
fs.mkdirSync(outDir, { recursive: true });

const HEADER = (src) => `// @ts-nocheck — verbatim legacy port (documented exception); see below.
/* eslint-disable */
/**
 * VERBATIM PORT of legacy \`${src}\` to a TypeScript ES module.
 * Clinical morphology, geometry and teaching text are unchanged.
 * New code must consume this module via the typed facade in \`./api.ts\`
 * (ECG) or the typed data modules (learning).
 */
`;

function stripIife(src) {
  let s = src;
  // Remove license/header comment? No — keep comments. Only strip wrapper:
  s = s.replace(/\(function\s*\(\)\s*\{\s*/, '');
  s = s.replace(/'use strict';\s*/, '');
  // Remove trailing IIFE close: last occurrence of "}());" or "})();"
  const idx = s.lastIndexOf('}());');
  if (idx !== -1) s = s.slice(0, idx) + s.slice(idx + 5);
  const idx2 = s.lastIndexOf('})();');
  if (idx2 !== -1) s = s.slice(0, idx2) + s.slice(idx2 + 5);
  return s.trim() + '\n';
}

function guardTopLevelListeners(s) {
  // `window.addEventListener(` at statement start -> client-only guard
  return s.replace(
    /^(\s*)window\.addEventListener\(/gm,
    "$1if (typeof window !== 'undefined') window.addEventListener(",
  );
}

/** engine: pure math/SVG — no window refs except the export. */
function portEngine() {
  const src = fs.readFileSync(path.join(root, 'assets', 'ecg-engine.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace('window.ECG_ENGINE = {', 'export const ECG_ENGINE = {');
  fs.writeFileSync(path.join(outDir, 'engine.ts'), HEADER('assets/ecg-engine.js') + s);
}

/** svgLibrary: figure records + PNG dir. */
function portSvg() {
  const src = fs.readFileSync(path.join(root, 'assets', 'ecg-svg.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace('window.ECG_SVG = {', 'export const ECG_SVG = {');
  s = s.replace(/window\.ECG_SVG(\[|\.)/g, 'ECG_SVG$1');
  s = s.replace('window.ECG_PNG_DIR = ', 'export const ECG_PNG_DIR = ');
  fs.writeFileSync(path.join(outDir, 'svgLibrary.ts'), HEADER('assets/ecg-svg.js') + s);
}

/** caseTracings: library patch — wrap body in an exported function. */
function portCaseTracings() {
  const src = fs.readFileSync(path.join(root, 'assets', 'ecg-case-tracings.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace(/window\.ECG_ENGINE/g, 'ECG_ENGINE');
  s = s.replace(/window\.ECG_SVG/g, 'ECG_SVG');
  const body =
    HEADER('assets/ecg-case-tracings.js') +
    "import { ECG_ENGINE } from './engine';\n" +
    "import { ECG_SVG } from './svgLibrary';\n\n" +
    '/** Applies schematic/engine-backed case overlays onto the shared ECG_SVG library (legacy load-order side effect, now explicit). */\n' +
    'export function applyCaseTracings(): void {\n' +
    s
      .split('\n')
      .map((line) => (line.trim() ? '  ' + line : line))
      .join('\n') +
    '}\n';
  fs.writeFileSync(path.join(outDir, 'caseTracings.ts'), body);
}

/** interactive: workbench — imports + guarded top-level listener. */
function portInteractive() {
  const src = fs.readFileSync(path.join(root, 'assets', 'ecg-interactive.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace('var E = window.ECG_ENGINE, lib = window.ECG_SVG;', 'var E = ECG_ENGINE, lib = ECG_SVG;');
  s = s.replace('if (!E || !lib) return;', '');
  s = s.replace('window.ECG_INTERACTIVE = ', 'export const ECG_INTERACTIVE = ');
  s = guardTopLevelListeners(s);
  const body =
    HEADER('assets/ecg-interactive.js') +
    "import { ECG_ENGINE } from './engine';\n" +
    "import { ECG_SVG } from './svgLibrary';\n" +
    "import { applyCaseTracings } from './caseTracings';\n\n" +
    '// Legacy script order applied case-tracings before this module; reproduce explicitly.\n' +
    'applyCaseTracings();\n\n' +
    s;
  fs.writeFileSync(path.join(outDir, 'interactive.ts'), body);
}

/** curriculum: teaching strips — imports + export. */
function portCurriculum() {
  const src = fs.readFileSync(path.join(root, 'assets', 'ecg-curriculum.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace(
    'const E=window.ECG_ENGINE, I=window.ECG_INTERACTIVE, lib=window.ECG_SVG;',
    'const E=ECG_ENGINE, I=ECG_INTERACTIVE, lib=ECG_SVG;',
  );
  s = s.replace('window.ECG_CURRICULUM=', 'export const ECG_CURRICULUM=');
  const body =
    HEADER('assets/ecg-curriculum.js') +
    "import { ECG_ENGINE } from './engine';\n" +
    "import { ECG_INTERACTIVE } from './interactive';\n" +
    "import { ECG_SVG } from './svgLibrary';\n\n" +
    s;
  fs.writeFileSync(path.join(outDir, 'curriculum.ts'), body);
}

/** recordings: 905KB PTB-XL samples — verbatim data export (lazy-loaded by the UI). */
function portRecordings() {
  const src = fs.readFileSync(path.join(root, 'assets', 'ecg-recordings.js'), 'utf8');
  const s = src.replace('window.EM_ECG_RECORDINGS =', 'export const EM_ECG_RECORDINGS =');
  const dir = path.join(root, 'src', 'lib', 'learn');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'recordings.ts'),
    HEADER('assets/ecg-recordings.js') + s,
  );
}

/** em-learning: workspace logic — imports + export. */
function portEmLearning() {
  const src = fs.readFileSync(path.join(root, 'assets', 'em-learning.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace('const D = window.EM_LEARNING_DATA;', 'const D = EM_LEARNING_DATA;');
  s = s.replace('if (!D) return;', '');
  s = s.replace(/window\.STUDENT_LEARNING/g, 'STUDENT_LEARNING');
  s = s.replace(/window\.ECG_EXPLORER/g, 'ECG_EXPLORER');
  s = s.replace(/window\.EM_ECG_RECORDINGS/g, 'EM_ECG_RECORDINGS');
  s = s.replace('window.EM_LEARNING=', 'export const EM_LEARNING=');
  // Performance: the 884KB PTB-XL recording bank lazy-loads only when the
  // recordings visual opens (see LearnWorkspace). Same content, deferred fetch.
  const body =
    HEADER('assets/em-learning.js') +
    "import { EM_LEARNING_DATA } from '@/data/emLearning';\n" +
    "import { STUDENT_LEARNING } from './studentLearning';\n" +
    "import { ECG_EXPLORER } from '../ecg/explorer';\n\n" +
    'let EM_ECG_RECORDINGS = [];\n' +
    'export function setEcgRecordings(records) { EM_ECG_RECORDINGS = Array.isArray(records) ? records : []; }\n\n' +
    s;
  const dir = path.join(root, 'src', 'lib', 'learn');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'emLearning.ts'), body);
}

/** student-learning: cases + self-assessment — export; auto-enhance disabled (React owns the DOM). */
function portStudentLearning() {
  const src = fs.readFileSync(path.join(root, 'assets', 'student-learning.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace(/window\.CP_DATA/g, 'CP_DATA_TOPICS');
  s = s.replace(/window\.ECG_EXPLORER/g, 'ECG_EXPLORER');
  s = s.replace('window.STUDENT_LEARNING=', 'export const STUDENT_LEARNING=');
  // Legacy auto-start moved topbar filters and bound global listeners; the
  // React shell owns the DOM now, so enhancement runs only on explicit opt-in.
  s = s.replace(
    "if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();",
    "if(typeof document!=='undefined'&&document.getElementById('stage')?.hasAttribute('data-legacy-enhance')){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();}",
  );
  const dir = path.join(root, 'src', 'lib', 'learn');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'studentLearning.ts'), HEADER('assets/student-learning.js') +
    "import { TOPICS as CP_DATA_TOPICS } from '@/data/topics';\n" +
    "import { ECG_EXPLORER } from '../ecg/explorer';\n\n" + s);
}
function portExplorer() {
  const src = fs.readFileSync(path.join(root, 'assets', 'ecg-explorer.js'), 'utf8');
  let s = stripIife(src);
  s = s.replace('const E = window.ECG_ENGINE;', 'const E = ECG_ENGINE;');
  s = s.replace('if (!E || !window.ECG_SVG) return;', '');
  s = s.replace(/window\.ECG_SVG/g, 'ECG_SVG');
  s = s.replace('const curriculum=window.ECG_CURRICULUM;', 'const curriculum=ECG_CURRICULUM;');
  s = s.replace(/window\.ECG_INTERACTIVE/g, 'ECG_INTERACTIVE');
  s = s.replace(/window\.ECG_EXPLORER\s*=/, 'export const ECG_EXPLORER=');
  // localStorage/document stay inside functions (client-only call sites).
  s = guardTopLevelListeners(s);
  const body =
    HEADER('assets/ecg-explorer.js') +
    "import { ECG_ENGINE } from './engine';\n" +
    "import { ECG_INTERACTIVE } from './interactive';\n" +
    "import { ECG_SVG } from './svgLibrary';\n" +
    "import { ECG_CURRICULUM } from './curriculum';\n\n" +
    s;
  fs.writeFileSync(path.join(outDir, 'explorer.ts'), body);
}

portEngine();
portSvg();
portCaseTracings();
portInteractive();
portCurriculum();
portExplorer();
portRecordings();
portEmLearning();
portStudentLearning();
console.log('ported ECG modules to', outDir);
