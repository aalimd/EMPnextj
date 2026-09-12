/**
 * Typed facade over the verbatim-ported ECG implementation modules.
 *
 * The ports under `./engine`, `./svgLibrary`, `./caseTracings`,
 * `./interactive`, `./curriculum`, `./explorer` preserve legacy logic
 * byte-for-byte (see their headers). This module is the ONLY surface new
 * application code should use: every export here is explicitly typed.
 */
import { ECG_ENGINE } from './engine';
import { ECG_SVG, ECG_PNG_DIR } from './svgLibrary';
import { ECG_INTERACTIVE } from './interactive';
import { ECG_CURRICULUM } from './curriculum';
import { ECG_EXPLORER } from './explorer';
import type { EcgCurriculumCase, EcgExplorerCase, EcgFigure } from '@/types';

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

export interface RenderedTwelveLead {
  svg: string;
  caseData: EcgCaseData;
  width: number;
  height: number;
}

export interface TraceSpec {
  pattern: string;
  lanes: string[];
  options: EcgPatternOptions;
  waves?: Record<string, unknown>;
  note?: string;
}

export interface InteractiveRenderOptions {
  speed?: 25 | 50;
  gain?: 5 | 10 | 20;
  duration?: number;
  lane?: string;
  artifact?: boolean;
  normal?: boolean;
  viewer?: boolean;
}

export interface InteractiveRenderResult {
  svg: string;
  rows: Array<{ lane: string; label: string }>;
  ux: number;
  uy: number;
  [key: string]: unknown;
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

const engine = ECG_ENGINE as unknown as {
  version: string;
  geom: { SVG_PER_MM: number; PAPER_SPEED_MM_S: number; GAIN_MM_MV: number; MS_PER_MM: number };
  mmToUnits(mm: number): number;
  msToMm(ms: number): number;
  msToUnits(ms: number): number;
  mvToMm(mv: number): number;
  mvToUnits(mv: number): number;
  rateToRRms(bpm: number): number;
  createNormalSinusCase(opts?: Record<string, unknown>): EcgCaseData;
  createPatternCase(patternId: string, opts?: EcgPatternOptions): EcgCaseData;
  leadVoltageAt(lead: string, tMs: number, caseData: EcgCaseData, sampleIdx?: number): number;
  renderNormal12Lead(opts?: Record<string, unknown>): RenderedTwelveLead;
  render12Lead(opts?: Record<string, unknown>): RenderedTwelveLead;
  layoutMetrics(): Record<string, number>;
  renderOmiLegend(): string;
  renderPaperGrid(w: number, h: number): string;
  renderCalibrationPulse(x: number, yBase: number): string;
  focusedTracePath(displayName: string, patternId: string, y: number, patternOpts?: EcgPatternOptions): { d: string };
  focusedFirstJX(patternId: string, patternOpts?: EcgPatternOptions): number;
  focusedApexX(displayName: string, patternId: string, patternOpts?: EcgPatternOptions): number;
  focusedOverlayY(displayName: string, patternId: string, y: number, patternOpts?: EcgPatternOptions): { jy: number; apexY: number; jMv: number; tMv: number };
  validateGeometry(): Array<{ name: string; got: number; want: number; ok: boolean }>;
  layout: { LAYOUT_3X4: string[][]; COL_DUR_MS: number };
  version_: string;
};

const svgLibrary = ECG_SVG as unknown as Record<string, EcgFigure & { traceSpec?: TraceSpec; findings?: EcgFinding[] }>;

const interactive = ECG_INTERACTIVE as unknown as {
  open(id: string, returnTo?: Element | null, settings?: Record<string, unknown>): void;
  close(): void;
  render(spec: TraceSpec, opts?: InteractiveRenderOptions): InteractiveRenderResult;
  measure(lead: string, data: EcgCaseData, t0: number, t1: number): { mv: number; ms: number };
  signal(spec: TraceSpec, lane: string, artifact?: boolean): { lead: string; data: EcgCaseData };
  findingTargets(id: string, opts?: Record<string, unknown>): Array<{ x: number; y: number; w: number; h: number }>;
};

const curriculum = ECG_CURRICULUM as unknown as {
  cases: EcgCurriculumCase[];
  sources: Record<string, { label: string; url: string }>;
  build(record: EcgCurriculumCase): { svg: string; findings: EcgFinding[] };
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

export const ENGINE_VERSION: string = engine.version;
export const ECG_PAPER_PNG_DIR: string = ECG_PNG_DIR as string;

export function getEcgFigure(id: string): (EcgFigure & { traceSpec?: TraceSpec; findings?: EcgFinding[] }) | undefined {
  return svgLibrary[id];
}

export function getEcgFigureIds(): string[] {
  return Object.keys(svgLibrary);
}

export function getEcgLibrary(): Record<string, EcgFigure> {
  return svgLibrary;
}

export function createNormalSinusCase(opts?: Record<string, unknown>): EcgCaseData {
  return engine.createNormalSinusCase(opts);
}

export function createPatternCase(patternId: string, opts?: EcgPatternOptions): EcgCaseData {
  return engine.createPatternCase(patternId, opts);
}

export function renderTwelveLead(opts?: Record<string, unknown>): RenderedTwelveLead {
  return engine.render12Lead(opts);
}

export function renderNormalTwelveLead(opts?: Record<string, unknown>): RenderedTwelveLead {
  return engine.renderNormal12Lead(opts);
}

export function leadVoltageAt(lead: string, tMs: number, caseData: EcgCaseData, sampleIdx?: number): number {
  return engine.leadVoltageAt(lead, tMs, caseData, sampleIdx);
}

export function renderInteractiveTrace(spec: TraceSpec, opts?: InteractiveRenderOptions): InteractiveRenderResult {
  return interactive.render(spec, opts);
}

export function interactiveSignal(spec: TraceSpec, lane: string, artifact?: boolean): { lead: string; data: EcgCaseData } {
  return interactive.signal(spec, lane, artifact);
}

export function interactiveFindingTargets(id: string, opts?: Record<string, unknown>): Array<{ x: number; y: number; w: number; h: number }> {
  return interactive.findingTargets(id, opts);
}

export function openEcgViewer(id: string, returnTo?: Element | null, settings?: Record<string, unknown>): void {
  interactive.open(id, returnTo ?? null, settings);
}

export function closeEcgViewer(): void {
  interactive.close();
}

export function getCurriculumCases(): EcgCurriculumCase[] {
  return curriculum.cases;
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
  const fn = (explorer as unknown as { containsPoint(t: unknown, x: number, y: number): boolean }).containsPoint;
  return fn(target, x, y);
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

export function validateEcgGeometry(): Array<{ name: string; got: number; want: number; ok: boolean }> {
  return engine.validateGeometry();
}
