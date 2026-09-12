import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getEcgFigure, getEcgFigureIds } from '@/lib/ecg/api';
import EcgFigure from '@/components/ecg/EcgFigure';

export function generateStaticParams(): Array<{ figureId: string }> {
  try {
    return getEcgFigureIds().map((figureId) => ({ figureId }));
  } catch {
    return [];
  }
}

export function generateMetadata({ params }: { params: { figureId: string } }): Metadata {
  try {
    const entry = getEcgFigure(params.figureId);
    const title = entry && typeof entry.title === 'string' ? entry.title : params.figureId;
    return { title: `${title} — ECG — EM Pocket` };
  } catch {
    return { title: 'ECG figure — EM Pocket' };
  }
}

export default function EcgFigurePage({ params }: { params: { figureId: string } }): JSX.Element {
  let entry = null;
  try {
    entry = getEcgFigure(params.figureId);
  } catch {
    entry = null;
  }
  if (!entry) notFound();
  return (
    <>
      <div className="cp-hero">
        <Link href="/ecg" className="back-btn">
          ← ECG Guide
        </Link>
        <h1 tabIndex={-1}>{String(entry.title ?? params.figureId)}</h1>
      </div>
      <EcgFigure figureId={params.figureId} />
      <p style={{ marginTop: 12 }}>
        <Link href="/ecg">Back to the ECG Guide →</Link>
      </p>
    </>
  );
}
