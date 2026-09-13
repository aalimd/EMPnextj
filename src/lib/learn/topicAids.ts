import { EM_LEARNING_DATA } from '@/data/emLearning';
import type { ClinicalTopic } from '@/types';

/**
 * Static learning-workspace snippets reused by content pages.
 *
 * Mechanically extracted verbatim from the ported workspace engine
 * (`./emLearning.ts`, itself a verbatim port of `assets/em-learning.js`)
 * so topic, guide and home pages don't bundle the full workspace engine
 * (sessions, cases, modules, recordings wiring). `emLearning.ts` imports
 * these same functions — single source, no duplication.
 */

function esc(value: string): string {
  return String(value).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}

export function sourceHtml(key: string): string {
  const source = (EM_LEARNING_DATA.sources as Record<string, [string, string]>)[key];
  return source
    ? '<details class="workspace-source"><summary>Source and scope</summary><p>Supporting teaching points checked ' +
        EM_LEARNING_DATA.checked +
        '. This is an educational synthesis, not an independently peer-reviewed protocol.</p><a href="' +
        esc(source[1]) +
        '" target="_blank" rel="noopener noreferrer">' +
        esc(source[0]) +
        '</a><p>Confirm patient context, full recommendations and local policy. External sources need an internet connection.</p></details>'
    : '';
}

/** Verbatim with `assets/em-learning.js` `visuals` list (search + cards). */
export const LEARNING_VISUALS: Array<[id: string, title: string, text: string]> = [
  ['recordings', 'Recorded ECGs: compare real examples', 'Four anonymized 12-lead recordings with original signals and source labels.'],
  ['abg', 'Blood gases: primary and mixed processes', 'Compare two fictional arterial samples and their expected compensation.'],
  ['lung', 'Lung ultrasound: artifacts and limits', 'Compare schematic A-lines and B-lines; discuss what a static picture cannot establish.'],
  ['chest', 'Chest imaging: look beyond the obvious', 'Compare diagrammed peripheral markings with a pleural-line pattern.'],
  ['ecg-pairs', 'ECG: compare related patterns', 'Inspect existing examples together and explain similarities and differences.'],
];

export function homeHtml(): string {
  return (
    '<section class="workspace-entry" aria-label="Choose how to use EM Pocket">' +
    '<a href="#presentationLibrary" data-browse-library="1"><span>01 · Presentations</span><strong>Rosen’s Clinical Frameworks</strong><p>Explore 30+ emergency complaints with prioritized differentials, red flags, first minutes and disposition.</p></a>' +
    '<a href="#ecg"><span>02 · ECG Masterclass</span><strong>10-Step ECG Curriculum &amp; Explorer</strong><p>Master rate, rhythm, axis, and ischemia from scratch with interactive 12-lead waveforms.</p></a>' +
    '<a href="#learn~practice"><span>03 · Decision Practice</span><strong>Simulated Patient Scenarios</strong><p>Test your reasoning in evolving clinical cases, manage deterioration, and review debriefs.</p></a>' +
    '</section>'
  );
}

export function reassessmentHtml(cp: Pick<ClinicalTopic, 'id' | 'name' | 'redFlags'>): string {
  return (
    '<details class="reassessment-guide"><summary>Before the next decision · reassess and hand over</summary><div><p>Use these learning prompts with the presentation’s pathway. They are not discharge criteria.</p><ol><li><strong>Reassess:</strong> compare symptoms, observations and examination with the initial assessment and response to treatment.</li><li><strong>Warning signs for ' +
    esc(cp.name) +
    ':</strong><ul>' +
    (cp.redFlags || []).map((t) => '<li>' + esc(t) + '</li>').join('') +
    '</ul></li><li><strong>Reconsider:</strong> check unresolved findings and alternative explanations, including the pitfalls below.</li><li><strong>Escalate:</strong> communicate deterioration, uncertainty or needs beyond the current setting.</li><li><strong>Plan the transition:</strong> identify outstanding results, responsibility for follow-up, patient understanding and specific return advice.</li></ol><a href="#' +
    esc(cp.id) +
    '~disposition">Review this presentation’s disposition pathway →</a><a href="#learn~module-handover">Practice a handover →</a></div></details>'
  );
}

const EVIDENCE_CONTEXTS: Record<string, [title: string, body: string, source: string]> = {
  'chest-pain': [
    'Troponin pathways',
    'Identify the assay, symptom timing and the validated pathway used locally. A result inside the reference range is not automatically a complete rule-out.',
    'acs',
  ],
  'multiple-trauma': [
    'Resources and definitive care',
    'Check the local trauma activation, trained procedural team and transfer arrangements. Imaging availability does not remove the need to respond to instability.',
    'trauma',
  ],
  'pediatric-respiratory-distress': [
    'Age and clinical course',
    'Check age, underlying conditions, feeding and episodes of apnea against the full pediatric pathway. One improved observation does not describe the whole course.',
    'pediatric',
  ],
  'pregnancy-emergency': [
    'Escalation and access',
    'Know the local route to urgent obstetric/gynecologic assessment and supported transfer. Clinical instability must guide the urgency while tests are pending.',
    'pregnancy',
  ],
  overdose: [
    'Exposure and observation',
    'The substance, recurrence and clinical course affect treatment and monitoring needs. Use substance-specific guidance and toxicology advice rather than one fixed observation period.',
    'opioid',
  ],
  suicidal: [
    'Assessment and safety planning',
    'A numeric risk category must not determine discharge after self-harm. Use an individual psychosocial assessment and a collaborative plan, alongside local legal and safeguarding requirements.',
    'mental',
  ],
};

export function evidenceContext(id: string): string {
  const item = EVIDENCE_CONTEXTS[id];
  if (!item) return '';
  return '<div class="workspace-callout evidence-context"><h3>' + esc(item[0]) + '</h3><p>' + esc(item[1]) + '</p>' + sourceHtml(item[2]) + '</div>';
}
