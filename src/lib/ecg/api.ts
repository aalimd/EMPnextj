/**
 * Typed facade over the verbatim-ported ECG implementation modules.
 *
 * The ports under `./engine`, `./svgLibrary`, `./caseTracings`,
 * `./interactive`, `./curriculum`, `./explorer` preserve legacy logic
 * byte-for-byte (see their headers). This module is the ONLY surface new
 * application code should use: every export here is explicitly typed and
 * consumed by the app (no speculative surface).
 */
import { ECG_SVG } from './svgLibrary';
import { ECG_INTERACTIVE } from './interactive';
import { ECG_CURRICULUM } from './curriculum';
import { ECG_EXPLORER } from './explorer';
import type { EcgExplorerCase, EcgFigure } from '@/types';

export interface EcgCaseData {
  rate: number;
  prMs: number;
  qrsMs: number;
  qtMs: number;
  axisDeg: number;
  seed: number;
  beatTimes: number[];
  [key: string]: unknown;
}

export interface EcgPatternOptions {
  lane?: string;
  variant?: string;
  stage?: string;
  stMv?: number;
  overrides?: Record<string, Record<string, number>>;
  noise?: { disabled?: boolean };
  [key: string]: unknown;
}

export interface TraceSpec {
  pattern: string;
  lanes: string[];
  options: EcgPatternOptions;
  waves?: Record<string, unknown>;
  note?: string;
}

export interface EcgFinding {
  title: string;
  leads: string[];
  segment: string;
  explanation: string;
}

export interface ExplorerProgress {
  last: string;
  finding: number;
  completed: string[];
  review: string[];
}

export interface ExplorerBuildFinding {
  title: string;
  explanation: string;
  targets: Array<[number, number, number, number]>;
}

export interface ExplorerBuild {
  record: EcgExplorerCase & { guide?: string; source?: string; stem?: string; kind?: string; library?: string };
  data?: EcgCaseData & { leadOverrides?: Record<string, Record<string, number>> };
  svg: string;
  width?: number;
  height?: number;
  findings: ExplorerBuildFinding[];
  format?: string;
  caption: string;
  scale?: string;
  note?: string;
}

const svgLibrary = ECG_SVG as unknown as Record<string, EcgFigure & { traceSpec?: TraceSpec; findings?: EcgFinding[] }>;

const interactive = ECG_INTERACTIVE as unknown as {
  open(id: string, returnTo?: Element | null, settings?: Record<string, unknown>): void;
  close(): void;
};

const curriculum = ECG_CURRICULUM as unknown as {
  sources: Record<string, { label: string; url: string }>;
};

const explorer = ECG_EXPLORER as unknown as {
  cases: EcgExplorerCase[];
  pathways: Array<{ title: string; objective: string; prior: string; ids: string[] }>;
  build(id: string, concealed?: boolean): ExplorerBuild;
  comparison(a: string, b: string): { svg: string } | null;
  containsPoint(shape: unknown, x: number, y: number): boolean;
  readProgress(): ExplorerProgress;
  saveProgress(value: ExplorerProgress): boolean;
  readPractice(): string[];
  savePractice(ids: string[]): boolean;
  nextPractice(attempted: string[], current: string, random?: () => number): string;
};

export function getEcgFigure(id: string): (EcgFigure & { traceSpec?: TraceSpec; findings?: EcgFinding[] }) | undefined {
  return svgLibrary[id];
}

export function getEcgFigureIds(): string[] {
  return Object.keys(svgLibrary);
}

export function openEcgViewer(id: string, returnTo?: Element | null, settings?: Record<string, unknown>): void {
  interactive.open(id, returnTo ?? null, settings);
}

export function closeEcgViewer(): void {
  interactive.close();
}

export function getCurriculumSources(): Record<string, { label: string; url: string }> {
  return curriculum.sources;
}

export function getExplorerCases(): EcgExplorerCase[] {
  return explorer.cases;
}

export function getExplorerPathways(): Array<{ title: string; objective: string; prior: string; ids: string[] }> {
  return explorer.pathways;
}

export function compareExplorerCases(a: string, b: string): { svg: string } | null {
  return explorer.comparison(a, b);
}

export function explorerContainsPoint(
  target: [number, number, number, number],
  x: number,
  y: number,
): boolean {
  return explorer.containsPoint(target, x, y);
}

export function buildExplorerCase(id: string, concealed?: boolean): ExplorerBuild {
  return explorer.build(id, concealed);
}

export function readExplorerProgress(): ExplorerProgress {
  return explorer.readProgress();
}

export function saveExplorerProgress(value: ExplorerProgress): boolean {
  return explorer.saveProgress(value);
}

export function readExplorerPractice(): string[] {
  return explorer.readPractice();
}

export function saveExplorerPractice(ids: string[]): boolean {
  return explorer.savePractice(ids);
}

export function nextExplorerPractice(attempted: string[], current: string, random?: () => number): string {
  return explorer.nextPractice(attempted, current, random);
}
