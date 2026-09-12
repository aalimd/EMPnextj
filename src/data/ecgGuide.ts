import raw from '@/generated/ECG_DATA.json';

export interface EcgGuideStep {
  num: number;
  id: string;
  name: string;
  icon?: string;
  summary: string;
  details: string[];
  pearl?: string;
  pitfall?: string;
}

export interface EcgGuidePattern {
  id: string;
  name: string;
  tag: string;
  severity: 'critical' | 'emergent' | 'common';
  category: string;
  leads?: string;
  criteria: string;
  significance?: string;
  action: string;
  caution?: string;
  comparison?: Array<[string, string]>;
}

export interface EcgGuide {
  title: string;
  subtitle?: string;
  tag: string;
  overview?: string;
  firstPass: string[];
  redFlags: string[];
  steps: EcgGuideStep[];
  patterns: EcgGuidePattern[];
  pearls: string[];
  pitfalls: string[];
  refs: string[];
  related: string[];
}

/** Verbatim ECG guide content. Source: legacy assets/data.js (ECG_DATA). No content edits. */
export const ECG_GUIDE: EcgGuide = raw as unknown as EcgGuide;

export const ECG_CAT_LABEL: Record<string, string> = {
  omi: 'OMI / STEMI',
  rhythm: 'Rhythm',
  toxic: 'Toxic-metabolic',
  mimics: 'Mimics',
};

export function resolveEcgTarget(target: string | undefined): string {
  if (!target) return '';
  if (target.startsWith('ecg-')) return target;
  if (ECG_GUIDE.steps.some((s) => s.id === target)) return `ecg-step-${target}`;
  if (target.startsWith('step-')) return `ecg-${target}`;
  if (ECG_GUIDE.patterns.some((p) => p.id === target)) return `ecg-pattern-${target}`;
  if (target === 'patterns') return 'ecg-patterns';
  if (target === 'red-flags') return 'ecg-red-flags';
  return target;
}
