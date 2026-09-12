import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ExplorerCaseView from '@/components/explorer/ExplorerCaseView';
import { getExplorerCases } from '@/lib/ecg/api';

export function generateStaticParams(): Array<{ caseId: string }> {
  try {
    return [...getExplorerCases().map((c) => ({ caseId: c.id })), { caseId: 'practice' }];
  } catch {
    return [{ caseId: 'practice' }];
  }
}

export function generateMetadata({ params }: { params: { caseId: string } }): Metadata {
  try {
    const found = getExplorerCases().find((c) => c.id === params.caseId);
    if (found) return { title: `${found.name} — ECG Explorer — EM Pocket` };
  } catch {
    /* fallback below */
  }
  return { title: 'ECG Explorer — EM Pocket' };
}

export default function ExplorerCasePage({ params }: { params: { caseId: string } }): JSX.Element {
  if (params.caseId === 'practice') {
    return <ExplorerCaseView caseId="normal" initialPractice key="explorer-practice" />;
  }
  try {
    const found = getExplorerCases().some((c) => c.id === params.caseId);
    if (!found) notFound();
  } catch {
    notFound();
  }
  return <ExplorerCaseView caseId={params.caseId} key={`explorer-${params.caseId}`} />;
}
