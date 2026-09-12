import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Clinical notice — EM Pocket' };

export default function DisclaimerPage(): JSX.Element {
  return (
    <div className="disclaimer-modal disclaimer-page">
      <div className="disclaimer-header">
        <div className="disclaimer-badge">
          <span>Mandatory Clinical Notice</span>
        </div>
        <h1>Educational &amp; Reference Purpose Only</h1>
      </div>
      <div className="disclaimer-body">
        <div className="disclaimer-callout">
          <strong>EM Pocket is designed solely for medical education, cognitive practice, and training reference.</strong>
        </div>
        <ul className="disclaimer-points">
          <li>
            <div>
              <strong>Not a Clinical Decision Support Tool</strong>
              <p>This software does not provide patient-specific medical advice, diagnostic certainty, or automated clinical triage.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Independent Clinical Responsibility</strong>
              <p>Always perform thorough in-person patient assessments, verify medication indications/dosages/contraindications, and follow local institutional protocols and senior supervision.</p>
            </div>
          </li>
          <li>
            <div>
              <strong>Rosen&apos;s &amp; Guidelines Foundation</strong>
              <p>Content is synthesized from <em>Rosen&apos;s Emergency Medicine</em> (10th ed., 2023) and corroborating consensus guidance for academic study.</p>
            </div>
          </li>
        </ul>
        <p>
          <Link href="/">Back to EM Pocket →</Link>
        </p>
      </div>
    </div>
  );
}
