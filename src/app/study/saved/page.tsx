import type { Metadata } from 'next';
import StudyQueueView from '@/components/study/StudyQueueView';

export const metadata: Metadata = { title: 'Saved topics — EM Pocket' };

export default function StudySavedPage(): JSX.Element {
  return <StudyQueueView view="saved" />;
}
