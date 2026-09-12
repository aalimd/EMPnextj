import Link from 'next/link';

export default function NotFound(): JSX.Element {
  return (
    <section className="study-page">
      <div className="study-page-head">
        <Link href="/" className="back-btn">
          ← All presentations
        </Link>
        <h1>Page not found</h1>
        <p>This EM Pocket page does not exist. Your saved progress is kept.</p>
      </div>
    </section>
  );
}
