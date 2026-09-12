import type { ClinicalEvidence } from '@/types';
import raw from '@/generated/CLINICAL_EVIDENCE.json';

/** Verbatim evidence map. Source: legacy assets/evidence.js. No content edits. */
export const EVIDENCE: ClinicalEvidence = raw as unknown as ClinicalEvidence;

export function evidenceFor(topicId: string): Array<{ key: string; label: string; url: string }> {
  const keys = EVIDENCE.topics[topicId] ?? [];
  return keys
    .map((key) => {
      const src = EVIDENCE.sources[key];
      if (!src) return null;
      return { key, label: src[0], url: src[1] };
    })
    .filter((x): x is { key: string; label: string; url: string } => x !== null);
}
