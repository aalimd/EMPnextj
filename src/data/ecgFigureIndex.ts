import raw from '@/generated/ECG_FIGURE_INDEX.json';

export interface EcgFigureIndexEntry {
  title: string;
  caption: string;
}

/**
 * Lightweight figure title/caption index (verbatim subset of the ECG library).
 * Used by search so it doesn't bundle the full ECG engine chain.
 */
export const ECG_FIGURE_INDEX: Record<string, EcgFigureIndexEntry> = raw as Record<string, EcgFigureIndexEntry>;

export function getEcgFigureIndexIds(): string[] {
  return Object.keys(ECG_FIGURE_INDEX);
}
