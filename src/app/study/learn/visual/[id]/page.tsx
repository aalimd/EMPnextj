import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';

const VISUALS = ['recordings', 'abg', 'lung', 'chest', 'ecg-pairs'] as const;

export function generateStaticParams(): Array<{ id: string }> {
  return VISUALS.map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  return { title: 'Visual learning — EM Pocket' };
}

export default function LearnVisualPage({ params }: { params: { id: string } }): JSX.Element {
  if (!(VISUALS as readonly string[]).includes(params.id)) notFound();
  return <LearnWorkspace target={`visual-${params.id}`} title="Visual learning" key={`learn-visual-${params.id}`} />;
}
