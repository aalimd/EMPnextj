/** Extracts the verbatim abbreviation glossary from legacy assets/student-learning.js. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'assets', 'student-learning.js'), 'utf8');

const marker = 'const glossary=';
const start = src.indexOf(marker);
if (start === -1) throw new Error('glossary not found');
let i = start + marker.length;
let depth = 0;
let inStr = null;
let esc = false;
let end = -1;
for (; i < src.length; i++) {
  const ch = src[i];
  if (inStr) {
    if (esc) esc = false;
    else if (ch === '\\') esc = true;
    else if (ch === inStr) inStr = null;
  } else if (ch === "'" || ch === '"' || ch === '`') {
    inStr = ch;
  } else if (ch === '{') {
    depth++;
  } else if (ch === '}') {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}
if (end === -1) throw new Error('unbalanced glossary');
const literal = src.slice(start + marker.length, end);

const out =
  `/**
 * Verbatim abbreviation glossary from legacy \`assets/student-learning.js\`.
 * No content edits — typed exports only.
 */
// @ts-nocheck — verbatim legacy literal (documented exception).
/* eslint-disable */

export const GLOSSARY: Record<string, string> = ${literal};
`;

fs.writeFileSync(path.join(root, 'src', 'data', 'glossary.ts'), out);
console.log('wrote src/data/glossary.ts');
