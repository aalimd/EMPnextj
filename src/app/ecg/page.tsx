import type { Metadata } from 'next';
import EcgGuideView from '@/components/ecg/EcgGuideView';

export const metadata: Metadata = { title: 'ECG Guide — EM Pocket' };

export default function EcgPage(): JSX.Element {
  return <EcgGuideView />;
}
