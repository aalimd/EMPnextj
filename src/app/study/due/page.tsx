import Link from 'next/link';
import type { Metadata } from 'next';
import StudyQueueView from '@/components/study/StudyQueueView';

export const metadata: Metadata = { title: 'Review queue — EM Pocket' };

export default function StudyDuePage(): JSX.Element {
  return <StudyQueueView view="due" />;
}
