'use client';

import { useEffect, useState } from 'react';
import { useLearning } from '@/lib/learning';
import { useChrome } from '@/components/chrome/ChromeContext';

export function ReviewButton({ topicId }: { topicId: string }): JSX.Element {
  const { reviewed, actionLabel, markReviewed, unmarkReviewed } = useLearning(topicId);
  const { showToast } = useChrome();
  const [label, setLabel] = useState(actionLabel);
  const [pressed, setPressed] = useState(reviewed);

  useEffect(() => {
    setLabel(actionLabel);
    setPressed(reviewed);
  }, [actionLabel, reviewed]);

  const onClick = (): void => {
    if (reviewed) {
      const persisted = unmarkReviewed();
      setLabel('Mark reviewed');
      setPressed(false);
      showToast(`Removed from your review schedule.${persisted ? '' : ' This change lasts for this session only.'}`);
      return;
    }
    const result = markReviewed();
    setLabel('✓ Review scheduled');
    setPressed(true);
    showToast(`${result.message}${result.persisted ? '' : ' Saved for this session only.'}`);
  };

  return (
    <button type="button" className="review-btn" id="reviewBtn" aria-pressed={pressed} onClick={onClick}>
      {label}
    </button>
  );
}

export function PersonalPlan({ topicId }: { topicId: string }): JSX.Element {
  const { saved, note, status, toggleSaved, saveNote } = useLearning(topicId);
  const { showToast } = useChrome();
  const [draft, setDraft] = useState(note);
  const [noteStatus, setNoteStatus] = useState('');

  useEffect(() => {
    setDraft(note);
  }, [note]);

  const onSaveTopic = (): void => {
    const result = toggleSaved();
    showToast(
      `${result.saved ? 'Saved to your study list.' : 'Removed from saved topics.'}${result.persisted ? '' : ' This change lasts for this session only.'}`,
    );
  };

  const onSaveNote = (): void => {
    const persisted = saveNote(draft);
    setNoteStatus(persisted ? 'Saved on this device.' : 'Saved for this session only.');
    showToast(persisted ? 'Learning note saved.' : 'Learning note saved for this session only.');
  };

  return (
    <section className="personal-plan" aria-label="Personal study notes">
      <div>
        <span className="study-kicker">PRIVATE TO THIS DEVICE</span>
        <h2>Your learning note</h2>
        <p>Capture a weak point, a teaching pearl, or a question to take to your next shift.</p>
      </div>
      <div className="personal-controls">
        <button
          type="button"
          className={`save-topic${saved ? ' active' : ''}`}
          id="saveTopic"
          aria-pressed={saved}
          onClick={onSaveTopic}
        >
          {saved ? '★ Saved topic' : '☆ Save topic'}
        </button>
        <span className="review-status">{status}</span>
      </div>
      <label htmlFor="studyNote">Private note</label>
      <textarea
        id="studyNote"
        rows={3}
        maxLength={800}
        placeholder="Example: I need to revisit the disposition threshold…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
      />
      <div className="note-actions">
        <button type="button" className="rf-clear" id="saveNote" onClick={onSaveNote}>
          Save note
        </button>
        <span id="noteStatus">{noteStatus}</span>
      </div>
    </section>
  );
}
