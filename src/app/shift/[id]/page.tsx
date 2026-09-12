import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TOPIC_IDS, getTopic } from '@/data/topics';
import { ShiftPageView } from '@/components/shift/ShiftView';

export function generateStaticParams(): Array<{ id: string }> {
  return TOPIC_IDS.map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const topic = getTopic(params.id);
  return { title: topic ? `Shift view · ${topic.name} — EM Pocket` : 'Shift view — EM Pocket' };
}

export default function ShiftTopicPage({ params }: { params: { id: string } }): JSX.Element {
  const topic = getTopic(params.id);
  if (!topic) notFound();
  return <ShiftPageView topicId={topic.id} />;
}
