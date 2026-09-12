'use client';

import { useState } from 'react';
import { usePrefs } from '@/lib/preferences';

/** Mandatory clinical notice gate (legacy disclaimer parity). */
export default function DisclaimerDialog(): JSX.Element | null {
  const { disclaimerAgreed, agreeDisclaimer } = usePrefs();
  const [checked, setChecked] = useState(false);

  if (disclaimerAgreed) return null;

  return (
    <div className="disclaimer-overlay" id="disclaimerOverlay" role="dialog" aria-modal="true" aria-labelledby="disclaimerTitle" aria-describedby="disclaimerDesc">
      <div className="disclaimer-modal">
        <div className="disclaimer-header">
          <div className="disclaimer-badge">
            <span className="badge-icon" aria-hidden="true">
              <svg className="mono-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3 2.5 20h19z" />
                <path d="M12 9v5M12 17.5h.01" />
              </svg>
            </span>
            <span>Mandatory Clinical Notice</span>
          </div>
          <h2 id="disclaimerTitle">Educational &amp; Reference Purpose Only</h2>
          <p id="disclaimerDesc" className="disclaimer-sub">Please review and confirm your agreement before accessing EM Pocket.</p>
        </div>

        <div className="disclaimer-body">
          <div className="disclaimer-callout">
            <strong>EM Pocket is designed solely for medical education, cognitive practice, and training reference.</strong>
          </div>
          <ul className="disclaimer-points">
            <li>
              <span className="point-ico" aria-hidden="true">
                <svg className="mono-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4.5 11a7.5 7.5 0 0 1 15 0v3.5l1.5 2.5h-18z" />
                  <path d="M10 19a2.2 2.2 0 0 0 4 0" />
                </svg>
              </span>
              <div>
                <strong>Not a Clinical Decision Support Tool</strong>
                <p>This software does not provide patient-specific medical advice, diagnostic certainty, or automated clinical triage.</p>
              </div>
            </li>
            <li>
              <span className="point-ico" aria-hidden="true">
                <svg className="mono-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l7 3v5c0 5-3.5 8.2-7 9-3.5-.8-7-4-7-9V6z" />
                  <path d="M9.5 12l2 2 3.5-4" />
                </svg>
              </span>
              <div>
                <strong>Independent Clinical Responsibility</strong>
                <p>Always perform thorough in-person patient assessments, verify medication indications/dosages/contraindications, and follow local institutional protocols and senior supervision.</p>
              </div>
            </li>
            <li>
              <span className="point-ico" aria-hidden="true">
                <svg className="mono-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" />
                  <path d="M4 20.5V5.5M8 7h8" />
                </svg>
              </span>
              <div>
                <strong>Rosen&apos;s &amp; Guidelines Foundation</strong>
                <p>Content is synthesized from <em>Rosen&apos;s Emergency Medicine</em> (10th ed., 2023) and corroborating consensus guidance for academic study.</p>
              </div>
            </li>
          </ul>

          <label className="disclaimer-agree-label" htmlFor="disclaimerCheck">
            <input
              type="checkbox"
              id="disclaimerCheck"
              required
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
            />
            <span>I understand and agree that EM Pocket is strictly an educational tool, and that all clinical decisions and patient care remain my independent professional responsibility.</span>
          </label>
        </div>

        <div className="disclaimer-footer">
          <button
            type="button"
            className="disclaimer-btn"
            id="disclaimerAcceptBtn"
            disabled={!checked}
            onClick={agreeDisclaimer}
          >
            <span>Accept &amp; Enter EM Pocket</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
