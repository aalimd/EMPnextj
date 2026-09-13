import raw from '@/generated/ECG_EXPLORER_CASES.json';

export interface ExplorerIndexEntry {
  id: string;
  name: string;
  category: string;
  summary: string;
  guide?: string;
  source?: string;
  pattern?: string;
  variant?: string;
}

/**
 * Lightweight explorer name/category index (verbatim subset of the ported
 * explorer cases). Used by search, resume-track and other light paths so
 * they don't pull the full ECG engine chain into every page bundle.
 */
export const EXPLORER_INDEX: ExplorerIndexEntry[] = (raw as unknown as ExplorerIndexEntry[]).filter(
  (c) => c && typeof c.id === 'string',
);
