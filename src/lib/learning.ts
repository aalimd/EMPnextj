'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Personal learning store — verbatim `em-cps-learning` shape from legacy
 * `assets/app.js` ({reviewed, reviewPlan, saved, notes}). No schema change,
 * so existing on-device progress and backup files keep working.
 */
const LEARNING_KEY = 'em-cps-learning';
export const REVIEW_INTERVALS = [1, 3, 7, 14];

interface ReviewPlan {
  stage: number;
  dueAt: number;
}

interface LearningStore {
  reviewed: Record<string, number>;
  reviewPlan: Record<string, ReviewPlan>;
  saved: Record<string, number>;
  notes: Record<string, string>;
}

function normalize(value: unknown): LearningStore {
  const data = value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
  const rec = (v: unknown): Record<string, never> | Record<string, unknown> =>
    v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
  return {
    reviewed: rec(data.reviewed) as Record<string, number>,
    reviewPlan: rec(data.reviewPlan) as Record<string, ReviewPlan>,
    saved: rec(data.saved) as Record<string, number>,
    notes: rec(data.notes) as Record<string, string>,
  };
}

function readStore(): LearningStore {
  try {
    return normalize(JSON.parse(localStorage.getItem(LEARNING_KEY) || '{}'));
  } catch {
    return normalize({});
  }
}

function writeStore(store: LearningStore): boolean {
  try {
    localStorage.setItem(LEARNING_KEY, JSON.stringify(normalize(store)));
    return true;
  } catch {
    return false;
  }
}

export function reviewLabelFor(topicId: string, store: LearningStore): string {
  const item = store.reviewPlan[topicId];
  if (!item) return 'Not scheduled';
  if (Number(item.dueAt) <= Date.now()) return 'Due now';
  const days = Math.max(1, Math.ceil((Number(item.dueAt) - Date.now()) / 86400000));
  return `Review in ${days}d`;
}

export function reviewActionLabelFor(topicId: string, store: LearningStore): string {
  if (!store.reviewed[topicId]) return 'Mark reviewed';
  const item = store.reviewPlan[topicId];
  if (item && Number(item.dueAt) <= Date.now()) return 'Complete review';
  return '✓ Review scheduled';
}

export function readLearningStore(): LearningStore {
  if (typeof window === 'undefined') return normalize({});
  return readStore();
}

export function useLearning(topicId: string): {
  store: LearningStore;
  reviewed: boolean;
  saved: boolean;
  note: string;
  status: string;
  actionLabel: string;
  markReviewed: () => { message: string; persisted: boolean };
  unmarkReviewed: () => boolean;
  toggleSaved: () => { saved: boolean; persisted: boolean };
  saveNote: (note: string) => boolean;
} {
  const [store, setStore] = useState<LearningStore>(() => normalize({}));

  useEffect(() => {
    setStore(readStore());
  }, [topicId]);

  const markReviewed = useCallback((): { message: string; persisted: boolean } => {
    const learning = readStore();
    const alreadyScheduled = !!learning.reviewed[topicId];
    const previous = learning.reviewPlan[topicId] ?? {};
    const stage = Math.min((Number(previous.stage) || 0) + 1, REVIEW_INTERVALS.length);
    learning.reviewed[topicId] = Date.now();
    learning.reviewPlan[topicId] = { stage, dueAt: Date.now() + REVIEW_INTERVALS[stage - 1] * 86400000 };
    const persisted = writeStore(learning);
    setStore({ ...learning });
    const days = REVIEW_INTERVALS[Math.max(0, stage - 1)];
    return {
      message: alreadyScheduled ? `Review complete — next review in ${days} days.` : 'Reviewed — it will return in 1 day.',
      persisted,
    };
  }, [topicId]);

  const unmarkReviewed = useCallback((): boolean => {
    const learning = readStore();
    delete learning.reviewed[topicId];
    delete learning.reviewPlan[topicId];
    const persisted = writeStore(learning);
    setStore({ ...learning });
    return persisted;
  }, [topicId]);

  const toggleSaved = useCallback((): { saved: boolean; persisted: boolean } => {
    const learning = readStore();
    const saved = !learning.saved[topicId];
    if (saved) learning.saved[topicId] = Date.now();
    else delete learning.saved[topicId];
    const persisted = writeStore(learning);
    setStore({ ...learning });
    return { saved, persisted };
  }, [topicId]);

  const saveNote = useCallback(
    (note: string): boolean => {
      const learning = readStore();
      const trimmed = note.trim().slice(0, 800);
      if (trimmed) learning.notes[topicId] = trimmed;
      else delete learning.notes[topicId];
      const persisted = writeStore(learning);
      setStore({ ...learning });
      return persisted;
    },
    [topicId],
  );

  return {
    store,
    reviewed: !!store.reviewed[topicId],
    saved: !!store.saved[topicId],
    note: String(store.notes[topicId] || ''),
    status: store.reviewed[topicId] ? reviewLabelFor(topicId, store) : 'Review schedule starts when marked reviewed',
    actionLabel: reviewActionLabelFor(topicId, store),
    markReviewed,
    unmarkReviewed,
    toggleSaved,
    saveNote,
  };
}

export function getDueIds(validIds: string[]): string[] {
  const plan = readStore().reviewPlan;
  const now = Date.now();
  const valid = new Set(validIds);
  return Object.keys(plan).filter((id) => valid.has(id) && Number(plan[id].dueAt) <= now);
}

export function getSavedIds(): string[] {
  const saved = readStore().saved;
  return Object.keys(saved).filter((id) => saved[id]);
}
