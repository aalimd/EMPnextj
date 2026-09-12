'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { ClinicalTopic } from '@/types';
import { TOPICS, getTopic } from '@/data/topics';
import { useDocTitle } from '@/lib/useDocTitle';

export function ShiftSheet({ topic }: { topic: ClinicalTopic }): JSX.Element {
  const immediateWorkup = topic.workup[0] ? topic.workup[0][1].slice(0, 4) : [];
  const critical = topic.dontMiss.filter((d) => d[1] === 'critical').slice(0, 5);
  const escalation = topic.disposition.slice(-2);
  return (
    <section className="shift-sheet">
      <div className="shift-sheet-head">
        <div>
          <span>FOCUSED SHIFT VIEW</span>
          <h1>{topic.name}</h1>
          <p>{topic.tag}</p>
        </div>
        <Link className="review-btn" href={`/topic/${topic.id}`}>
          Open full pathway
        </Link>
      </div>
      <div className="shift-warning">
        Educational first-pass aid. Reassess the patient, confirm doses and use local protocols.
      </div>
      <div className="shift-grid">
        <section>
          <h2>1 · First minutes</h2>
          <ol>
            {topic.approach.slice(0, 3).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ol>
        </section>
        <section className="shift-red">
          <h2>2 · Escalate now if</h2>
          <ul>
            {topic.redFlags.slice(0, 6).map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>3 · Immediate workup</h2>
          <ul>
            {immediateWorkup.map((x, i) => (
              <li key={i}>{x}</li>
            ))}
          </ul>
        </section>
        <section>
          <h2>4 · Don’t miss</h2>
          <ul>
            {critical.map((x, i) => (
              <li key={i}>
                <strong>{x[0]}</strong>
                <br />
                <small>{x[2]}</small>
              </li>
            ))}
          </ul>
        </section>
        <section className="shift-disposition">
          <h2>5 · Disposition lane</h2>
          {escalation.map((x, i) => (
            <div key={i}>
              <strong>{x[0]}</strong>
              <p>{x[1]}</p>
            </div>
          ))}
        </section>
      </div>
    </section>
  );
}

function ShiftPicker({ currentId }: { currentId: string }): JSX.Element {
  const router = useRouter();
  return (
    <div className="shift-topline">
      <Link href="/" className="back-btn" data-home="1">
        ← All presentations
      </Link>
      <label htmlFor="shiftSelect">Presentation</label>
      <select
        id="shiftSelect"
        value={currentId}
        onChange={(e) => router.push(`/shift/${e.target.value}`)}
      >
        {TOPICS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export function ShiftPageView({ topicId }: { topicId: string }): JSX.Element {
  const topic = getTopic(topicId) ?? TOPICS[0];
  useDocTitle(`Shift view · ${topic.name}`);
  return (
    <>
      <ShiftPicker currentId={topic.id} />
      <ShiftSheet topic={topic} />
    </>
  );
}
