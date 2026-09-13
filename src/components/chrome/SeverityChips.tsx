'use client';

import { useChrome } from './ChromeContext';
import type { SeverityFilter } from '@/types';

/** Severity filter chips (legacy `#filterChips` parity). Rendered in the
 * library head (home) and the student intro (topics) — never in the topbar,
 * matching the legacy post-enhancement placement and its 5-child grid. */
export default function SeverityChips(): JSX.Element {
  const { severity, setSeverity } = useChrome();
  const chips: Array<{ id: SeverityFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'critical', label: 'Critical' },
    { id: 'emergent', label: 'Emergent' },
    { id: 'common', label: 'Common' },
  ];
  return (
    <div className="chips" id="filterChips" role="group" aria-label="Severity filter">
      {chips.map((c) => (
        <button
          key={c.id}
          className={`chip chip-${c.id}${severity === c.id ? ' active' : ''}`}
          type="button"
          data-sev={c.id}
          aria-pressed={severity === c.id}
          onClick={() => setSeverity(c.id)}
        >
          {c.id !== 'all' ? <span className={`sev-dot sev-${c.id}`} aria-hidden="true" /> : null}
          {c.label}
        </button>
      ))}
    </div>
  );
}
