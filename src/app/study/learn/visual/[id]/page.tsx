import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';
import { LEARNING_VISUALS } from '@/lib/learn/topicAids';

const VISUAL_IDS = LEARNING_VISUALS.map(([id]) => id);

export function generateStaticParams(): Array<{ id: string }> {
  return VISUAL_IDS.map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  return { title: 'Visual learning — EM Pocket' };
}

export default function LearnVisualPage({ params }: { params: { id: string } }): JSX.Element {
  if (!VISUAL_IDS.includes(params.id)) notFound();
  return <LearnWorkspace target={`visual-${params.id}`} title="Visual learning" key={`learn-visual-${params.id}`} />;
}
