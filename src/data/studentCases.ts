import type { StudentCase } from '@/types';
import raw from '@/generated/STUDENT_CASES.json';

/** Verbatim authored practice cases (12). Source: legacy assets/student-learning.js. No content edits. */
export const STUDENT_CASES: StudentCase[] = (raw ?? []) as unknown as StudentCase[];
