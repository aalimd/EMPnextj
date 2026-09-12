import type { EcgCurriculumCase } from '@/types';
import raw from '@/generated/ECG_CURRICULUM.json';

/** Verbatim ECG curriculum cases (39). Source: legacy assets/ecg-curriculum.js. No content edits. */
export const ECG_CURRICULUM_CASES: EcgCurriculumCase[] = (raw ?? []) as unknown as EcgCurriculumCase[];
