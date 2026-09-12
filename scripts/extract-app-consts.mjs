/** Extracts verbatim data literals from legacy assets/app.js into a typed TS module. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'assets', 'app.js'), 'utf8');

function extractConst(name) {
  const marker = `const ${name} = `;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error('const not found: ' + name);
  let i = start + marker.length;
  const open = src[i];
  const close = open === '{' ? '}' : open === '[' ? ']' : null;
  if (!close) throw new Error('unexpected literal for ' + name);
  let depth = 0;
  let inStr = null;
  let esc = false;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === inStr) inStr = null;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inStr = ch;
    } else if (ch === open) {
      depth++;
    } else if (ch === close) {
      depth--;
      if (depth === 0) return src.slice(start + marker.length, i + 1);
    }
  }
  throw new Error('unbalanced literal for ' + name);
}

const groups = extractConst('GROUPS');
const related = extractConst('RELATED');
const patientContexts = extractConst('PATIENT_CONTEXTS');
const cpColorSvg = extractConst('CP_COLOR_SVG');

const out =
  `/**
 * Verbatim library metadata from legacy \`assets/app.js\` (GROUPS, RELATED,
 * PATIENT_CONTEXTS, CP_COLOR_SVG). No content edits — typed exports only.
 */
// @ts-nocheck — verbatim legacy literals (documented exception).
/* eslint-disable */

function colorSvg(inner: string): string {
  return '<svg class="color-ico" viewBox="0 0 32 32" aria-hidden="true" focusable="false">' + inner + '</svg>';
}

export interface TopicGroup { title: string; ids: string[] }

export const GROUPS: TopicGroup[] = ${groups};

export const RELATED: Record<string, string[]> = ${related};

export const PATIENT_CONTEXTS: Record<string, string[]> = ${patientContexts};

export const CP_COLOR_SVG: Record<string, string> = ${cpColorSvg};
`;

fs.mkdirSync(path.join(root, 'src', 'lib'), { recursive: true });
fs.writeFileSync(path.join(root, 'src', 'lib', 'libraryMeta.ts'), out);
console.log('wrote src/lib/libraryMeta.ts');
