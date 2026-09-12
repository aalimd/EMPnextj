import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';
import { EM_LEARNING_DATA } from '@/data/emLearning';

export function generateStaticParams(): Array<{ id: string }> {
  return EM_LEARNING_DATA.cases.map((c) => ({ id: String(c.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const found = EM_LEARNING_DATA.cases.find((c) => String(c.id) === params.id);
  return { title: found ? `${String(found.title)} — Evolving case — EM Pocket` : 'Evolving case — EM Pocket' };
}

export default function LearnCasePage({ params }: { params: { id: string } }): JSX.Element {
  const found = EM_LEARNING_DATA.cases.some((c) => String(c.id) === params.id);
  if (!found) notFound();
  return <LearnWorkspace target={`case-${params.id}`} title="Evolving case" key={`learn-case-${params.id}`} />;
}
