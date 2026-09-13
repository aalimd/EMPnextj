'use client';

import { useEffect, useState } from 'react';
import { STUDENT_LEARNING } from '@/lib/learn/studentLearning';

interface ConfidenceApi {
  read(): { ratings: Record<string, { value: string; at: number }>; last: string };
  rate(key: string, value: string): boolean;
  ratingHtml(key: string): string;
}

const api = STUDENT_LEARNING as unknown as ConfidenceApi;

/** Self-assessment buttons (legacy `ratingHtml` + confidence-click parity). */
export function ConfidenceRating({ ratingKey }: { ratingKey: string }): JSX.Element {
  const [value, setValue] = useState<string | null>(null);
  const [status, setStatus] = useState('Self-rated · saved on this device');

  useEffect(() => {
    try {
      const current = api.read().ratings[ratingKey]?.value ?? null;
      setValue(current);
    } catch {
      setValue(null);
    }
  }, [ratingKey]);

  const choose = (v: string): void => {
    let ok = false;
    try {
      ok = api.rate(ratingKey, v);
    } catch {
      ok = false;
    }
    setValue(v);
    setStatus(`Self-assessment saved${ok ? ' on this device.' : ' for this session only.'}`);
    if (v === 'got' && ratingKey.startsWith('topic:')) {
      const review = document.getElementById('reviewBtn');
      if (review && review.getAttribute('aria-pressed') !== 'true') review.click();
    }
  };

  return (
    <div className="confidence" data-rating-key={ratingKey}>
      <div className="confidence-buttons">
        {[
          ['got', 'Got it'],
          ['partly', 'Partly'],
          ['again', 'Review again'],
        ].map(([v, label]) => (
          <button key={v} type="button" data-confidence={v} aria-pressed={value === v} onClick={() => choose(v)}>
            {label}
          </button>
        ))}
      </div>
      <p className="confidence-status" role="status">{status}</p>
    </div>
  );
}
