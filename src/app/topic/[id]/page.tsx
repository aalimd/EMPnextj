import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { TOPIC_IDS, getTopic } from '@/data/topics';
import TopicView from '@/components/topic/TopicView';

export function generateStaticParams(): Array<{ id: string }> {
  return TOPIC_IDS.map((id) => ({ id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const topic = getTopic(params.id);
  return {
    title: topic ? `${topic.name} — EM Pocket` : 'EM Pocket — Emergency Medicine Reference',
    description: topic?.tag,
  };
}

export default function TopicPage({ params }: { params: { id: string } }): JSX.Element {
  const topic = getTopic(params.id);
  if (!topic) notFound();
  return <TopicView topic={topic} />;
}
