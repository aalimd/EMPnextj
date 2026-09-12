/**
 * Shared domain types for EM Pocket (Next.js migration).
 * These describe the legacy clinical/ECG payloads verbatim — no medical
 * content was altered when adding these types.
 */

export type Severity = 'critical' | 'emergent' | 'common';

export type DontMissItem = [title: string, severity: Severity, detail: string];
export type WorkupGroup = [title: string, items: string[]];
export type DispositionLane = [title: string, detail: string];

export interface ClinicalTopic {
  id: string;
  name: string;
  icon: string;
  tag: string;
  overview: string;
  approach: string[];
  dontMiss: DontMissItem[];
  history: string[];
  exam: string[];
  workup: WorkupGroup[];
  redFlags: string[];
  disposition: DispositionLane[];
  pitfalls: string[];
  pearls?: string[];
  refs: string[];
}

export interface EvidenceSource {
  [key: string]: [label: string, url: string];
}

export interface ClinicalEvidence {
  checked: string;
  sources: Record<string, [label: string, url: string]>;
  topics: Record<string, string[]>;
}

export interface EcgFigure {
  title?: string;
  caption?: string;
  svg?: string;
  png?: string | null;
  noCompare?: boolean;
  sourceNote?: string;
  [key: string]: unknown;
}

export type EcgSvgLibrary = Record<string, EcgFigure>;

export interface EcgLesson {
  title: string;
  explanation: string;
  a: number;
  b: number;
  lane?: number;
}

export interface EcgCurriculumCase {
  id: string;
  name: string;
  category: string;
  summary: string;
  kind: string;
  lessons: EcgLesson[];
  source?: string;
  stem?: string;
  guide?: string;
}

export interface EcgExplorerCase {
  id: string;
  name: string;
  category: string;
  summary: string;
  pattern?: string;
  variant?: string;
  guide?: string;
  source?: string;
  overrides?: Record<string, Record<string, number>>;
}

export interface QuizOption {
  id: string;
  text: string;
  why: string;
  correct: boolean;
}

export interface QuizQuestion {
  prompt: string;
  options: QuizOption[];
}

export interface StudentCase {
  id: string;
  title: string;
  stem: string;
  questions: QuizQuestion[];
}

export type Accent = 'emerald' | 'ocean' | 'violet' | 'rose' | 'amber' | 'teal';
export type Theme = 'light' | 'dark';

export interface Prefs {
  theme: Theme;
  accent: Accent;
  bold: boolean;
  scale: number;
  sidebar: boolean;
}

export interface SearchResultItem {
  cpId: string;
  target: string;
  title: string;
  sub: string;
  kind: string;
}

export type SeverityFilter = 'all' | Severity;
export type PatientFilter = 'all' | 'pediatric' | 'pregnancy' | 'geriatric' | 'immunocompromised' | 'trauma';
