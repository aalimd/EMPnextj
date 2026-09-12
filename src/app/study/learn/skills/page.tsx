import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';

export const metadata: Metadata = { title: 'Procedures & teams — EM Pocket' };

export default function LearnSkillsPage(): JSX.Element {
  return <LearnWorkspace target="skills" title="Procedures & teams" key="learn-skills" />;
}
