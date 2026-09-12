'use client';

import { useState } from 'react';

export default function SectionCard({
  icon,
  title,
  sectionKey,
  defaultClosed,
  children,
}: {
  icon: string;
  title: string;
  sectionKey: string;
  defaultClosed?: boolean;
  children: React.ReactNode;
}): JSX.Element {
  const [closed, setClosed] = useState(!!defaultClosed);
  const sectionId = `section-${sectionKey}`;
  return (
    <section className={`section-card${closed ? ' closed' : ''}`} id={sectionId} data-section={sectionKey}>
      <button
        className="sec-head"
        type="button"
        aria-expanded={!closed}
        aria-controls={`${sectionId}-body`}
        onClick={() => setClosed((c) => !c)}
      >
        <span className="sec-ico">{icon}</span>
        <span>{title}</span>
        <span className="arrow">▼</span>
      </button>
      <div className="sec-body" id={`${sectionId}-body`}>
        {children}
      </div>
    </section>
  );
}
