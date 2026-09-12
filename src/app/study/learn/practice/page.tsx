import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';

export const metadata: Metadata = { title: 'Evolving cases — EM Pocket' };

export default function LearnPracticePage(): JSX.Element {
  return <LearnWorkspace target="practice" title="Evolving cases" key="learn-practice" />;
}
