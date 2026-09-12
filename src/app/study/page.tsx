import Link from 'next/link';
import type { Metadata } from 'next';
import StudyStarter from '@/components/study/StudyStarter';

export const metadata: Metadata = { title: 'Practice and learning workspace — EM Pocket' };

export default function StudyPage(): JSX.Element {
  return (
    <>
      <section className="study-page">
        <div className="study-page-head">
          <Link href="/" className="back-btn" data-home="1">
            ← All presentations
          </Link>
          <span className="study-kicker">PERSONAL STUDY SPACE</span>
          <h1>Practice and learning</h1>
          <p>Spaced review, short practice cases, and the evolving-case workspace.</p>
        </div>
        <div className="workspace-actions study-workspace-links">
          <Link href="/study/due">Review queue →</Link>
          <Link href="/study/saved">Saved topics →</Link>
          <Link href="/study/case">Practice case →</Link>
        </div>
        <div className="workspace-actions study-workspace-links">
          <Link href="/study/learn/practice">Evolving cases →</Link>
          <Link href="/study/learn/progress">Progress &amp; backup →</Link>
          <Link href="/study/learn/skills">Procedures &amp; teams →</Link>
        </div>
      </section>
      <StudyStarter />
    </>
  );
}
