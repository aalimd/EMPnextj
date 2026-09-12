/** Extracts verbatim ECG_WAVE_INFO from legacy assets/app.js into a typed TS module. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(root, 'assets', 'app.js'), 'utf8');

const marker = 'var ECG_WAVE_INFO = ';
const start = src.indexOf(marker);
if (start === -1) throw new Error('ECG_WAVE_INFO not found');
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
if (end === -1) throw new Error('unbalanced ECG_WAVE_INFO');
const literal = src.slice(start + marker.length, end);

const out =
  `/**
 * Verbatim wave explainer text from legacy \`assets/app.js\` (ECG_WAVE_INFO).
 * No content edits — typed exports only.
 */
// @ts-nocheck — verbatim legacy literals (documented exception).
/* eslint-disable */

export const ECG_WAVE_INFO: Record<string, [title: string, detail: string]> = ${literal};

export const ECG_WAVE_ORDER: string[] = ['cal','p','pr','qrs','st','t','qt','rr','narrow','wide','psinus','axis','reg','v1','v5','chambers','lowv','ant','inf','mirror','hyperacute','hyperk','wellens','dewinter','sgSte','sgStd','sgDis','post','ischa'];

export const ECG_WAVE_NAMES: Record<string, string> = {cal:'CAL 1mV',p:'P wave',pr:'PR',qrs:'QRS',st:'ST',t:'T wave',qt:'QT',rr:'RR rate',narrow:'Narrow QRS',wide:'Wide QRS',psinus:'Sinus P',axis:'Axis',reg:'Regularity',v1:'V1 S wave',v5:'V5 R wave',chambers:'Chamber clues',lowv:'Low voltage',ant:'Anterior STE',inf:'Inferior STE',mirror:'Mirror STD',hyperacute:'Hyperacute T',hyperk:'HyperK clue',wellens:'Wellens LAD',dewinter:'de Winter LAD',sgSte:'Concordant STE',sgStd:'Concordant STD',sgDis:'STE/S ≥25%',post:'Posterior mirror',ischa:'Ischaemia STD/TWI'};

export function ecgWaveText(wave: string): string {
  const info = ECG_WAVE_INFO[wave];
  if (!info) return '';
  return info[0] + ' — ' + info[1];
}
`;

fs.mkdirSync(path.join(root, 'src', 'lib', 'ecg'), { recursive: true });
fs.writeFileSync(path.join(root, 'src', 'lib', 'ecg', 'waveInfo.ts'), out);
console.log('wrote src/lib/ecg/waveInfo.ts');
