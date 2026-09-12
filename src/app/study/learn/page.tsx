import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';

export const metadata: Metadata = { title: 'Learning workspace — EM Pocket' };

export default function LearnIndexPage(): JSX.Element {
  return <LearnWorkspace target="practice" title="Learning workspace" key="learn-index" />;
}
