'use client';

import { useState } from 'react';
import type { ClinicalTopic } from '@/types';
import { useChrome } from '@/components/chrome/ChromeContext';

export default function RedFlagChecklist({ topic }: { topic: ClinicalTopic }): JSX.Element {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const { showToast } = useChrome();
  const total = topic.redFlags.length;
  const count = Object.values(checked).filter(Boolean).length;

  const toggle = (i: number): void => {
    setChecked((prev) => ({ ...prev, [i]: !prev[i] }));
  };

  const clear = (): void => {
    setChecked({});
    showToast('Red-flag checklist cleared for this session.');
  };

  const copyReview = async (): Promise<void> => {
    const selected = topic.redFlags.filter((_, i) => checked[i]);
    const summary =
      `EM Pocket educational review — ${topic.name}\nSelected red flags: ` +
      (selected.length ? selected.map((x) => `• ${x}`).join('\n') : 'None selected') +
      '\n\nUse clinical judgment and local protocols.';
    try {
      await navigator.clipboard.writeText(summary);
      showToast('Session review copied to your clipboard.');
    } catch {
      showToast('Could not copy this review. Select the checklist text manually.');
    }
  };

  return (
    <div className="rf-box">
      <div className={`rf-banner${count > 0 ? ' show level-mid' : ''}`} id="rfBanner" role="status">
        {count > 0
          ? `${count} warning sign${count > 1 ? 's' : ''} selected. Assess each finding and the patient’s condition; a single serious finding may need immediate escalation. The count is not a severity score.`
          : ''}
      </div>
      <p style={{ fontSize: '.78rem', color: 'var(--ink-soft)', marginBottom: 6 }}>
        Tick what your patient has — the banner updates as you go.
      </p>
      <div className="rf-tools">
        <button type="button" className="rf-clear" id="clearRedFlags" onClick={clear}>
          Clear selected
        </button>
        <button type="button" className="rf-clear" id="copyReview" onClick={copyReview}>
          Copy review
        </button>
      </div>
      {topic.redFlags.map((rf, i) => (
        <label key={i} className={`rf-item${checked[i] ? ' is-checked' : ''}`}>
          <input type="checkbox" data-rf={i} checked={!!checked[i]} onChange={() => toggle(i)} />
          <span>{rf}</span>
        </label>
      ))}
      <div className="rf-progress">
        <i id="rfBar" style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
      </div>
    </div>
  );
}
