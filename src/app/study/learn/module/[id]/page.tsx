import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import LearnWorkspace from '@/components/learn/LearnWorkspace';
import { EM_LEARNING_DATA } from '@/data/emLearning';

export function generateStaticParams(): Array<{ id: string }> {
  return EM_LEARNING_DATA.modules.map((m) => ({ id: String(m.id) }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const found = EM_LEARNING_DATA.modules.find((m) => String(m.id) === params.id);
  return { title: found ? `${String(found.title)} — Skills — EM Pocket` : 'Skills exercise — EM Pocket' };
}

export default function LearnModulePage({ params }: { params: { id: string } }): JSX.Element {
  const found = EM_LEARNING_DATA.modules.some((m) => String(m.id) === params.id);
  if (!found) notFound();
  return <LearnWorkspace target={`module-${params.id}`} title="Skills exercise" key={`learn-module-${params.id}`} />;
}
