'use client';

import { useState } from 'react';
import { ConfidenceRating } from '@/components/learn/ConfidenceRating';

export interface RecallItem {
  index: string;
  label: string;
  prompt: string;
  answer: string;
}

export default function RecallPractice({ topicId, items }: { topicId: string; items: RecallItem[] }): JSX.Element {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const allRevealed = items.every((item) => revealed[item.index]);

  return (
    <div className="recall-grid">
      {items.map((item) => (
        <div className="recall-card" key={item.index}>
          <span>{item.label}</span>
          <p>{item.prompt}</p>
          <button
            type="button"
            className="reveal-btn"
            data-reveal={item.index}
            onClick={() => setRevealed((prev) => ({ ...prev, [item.index]: !prev[item.index] }))}
          >
            {revealed[item.index] ? 'Hide answer' : 'Reveal answer'}
          </button>
          <div className="reveal-answer" id={`recall-${item.index}`} hidden={!revealed[item.index]}>
            {item.answer}
          </div>
        </div>
      ))}
      {allRevealed ? (
        <div className="recall-confidence">
          <p>After checking both answers, rate your recall.</p>
          <ConfidenceRating ratingKey={`topic:${topicId}`} />
        </div>
      ) : null}
    </div>
  );
}
