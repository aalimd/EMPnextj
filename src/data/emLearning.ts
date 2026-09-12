import raw from '@/generated/EM_LEARNING_DATA.json';

export interface EmLearningModule {
  id: string;
  title: string;
  kind: string;
  [key: string]: unknown;
}

export interface EmLearningCase {
  id: string;
  title: string;
  domain: string;
  [key: string]: unknown;
}

export interface EmLearningData {
  sources: Record<string, [string, string]>;
  cases: EmLearningCase[];
  modules: EmLearningModule[];
  checked: string;
  [key: string]: unknown;
}

/** Verbatim learning workspace data. Source: legacy assets/em-learning-data.js. No content edits. */
export const EM_LEARNING_DATA: EmLearningData = raw as unknown as EmLearningData;
