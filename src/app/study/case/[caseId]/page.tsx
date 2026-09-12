import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import StudyCaseView from '@/components/study/StudyCaseView';
import { STUDENT_CASES } from '@/data/studentCases';

export function generateStaticParams(): Array<{ caseId: string }> {
  return STUDENT_CASES.map((c) => ({ caseId: c.id }));
}

export function generateMetadata({ params }: { params: { caseId: string } }): Metadata {
  const found = STUDENT_CASES.find((c) => c.id === params.caseId);
  return { title: found ? `${found.title} — Practice — EM Pocket` : 'Practice case — EM Pocket' };
}

export default function StudyCaseDetailPage({ params }: { params: { caseId: string } }): JSX.Element {
  const found = STUDENT_CASES.some((c) => c.id === params.caseId);
  if (!found) notFound();
  return <StudyCaseView caseId={params.caseId} key={`study-case-${params.caseId}`} />;
}
