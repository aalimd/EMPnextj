import type { Metadata } from 'next';
import StudyCaseView from '@/components/study/StudyCaseView';

export const metadata: Metadata = { title: 'Practice case — EM Pocket' };

export default function StudyCasePage(): JSX.Element {
  return <StudyCaseView key="study-case" />;
}
