import type { ClinicalTopic } from '@/types';
import raw from '@/generated/CP_DATA.json';

/** Verbatim clinical library (45 presentations). Source: legacy assets/data.js. No content edits. */
export const TOPICS: ClinicalTopic[] = raw as unknown as ClinicalTopic[];

export const TOPIC_BY_ID: Record<string, ClinicalTopic> = Object.fromEntries(
  TOPICS.map((t) => [t.id, t]),
);

export function getTopic(id: string | undefined): ClinicalTopic | undefined {
  if (!id) return undefined;
  return TOPIC_BY_ID[id];
}

export const TOPIC_IDS: string[] = TOPICS.map((t) => t.id);
