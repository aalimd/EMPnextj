import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';

export const metadata: Metadata = { title: 'My progress — EM Pocket' };

export default function LearnProgressPage(): JSX.Element {
  return <LearnWorkspace target="progress" title="My progress" key="learn-progress" />;
}
