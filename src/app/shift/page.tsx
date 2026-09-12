import type { Metadata } from 'next';
import { TOPICS } from '@/data/topics';
import { ShiftPageView } from '@/components/shift/ShiftView';

export const metadata: Metadata = { title: 'Shift view — EM Pocket' };

export default function ShiftPage(): JSX.Element {
  return <ShiftPageView topicId={TOPICS[0].id} />;
}
