import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';

export const metadata: Metadata = { title: 'Visual learning — EM Pocket' };

export default function LearnVisualsPage(): JSX.Element {
  return <LearnWorkspace target="visuals" title="Visual learning" key="learn-visuals" />;
}
