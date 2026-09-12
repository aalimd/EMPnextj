'use client';

import { useEffect, useRef } from 'react';
import { EM_LEARNING, setEcgRecordings } from '@/lib/learn/emLearning';
import { useDocTitle } from '@/lib/useDocTitle';

interface LearnApi {
  mount(stage: Element, target?: string): void;
}

const api = EM_LEARNING as unknown as LearnApi;

/**
 * Evolving-case learning workspace. The ported workspace engine renders and
 * binds its own markup into the container (verbatim behavior); internal
 * `#learn~…` links are translated to routes by the hash bridge.
 */
export default function LearnWorkspace({ target, title }: { target: string; title: string }): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  useDocTitle(title);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const mount = (): void => {
      if (cancelled) return;
      try {
        api.mount(host, target);
      } catch {
        host.innerHTML = '<p class="study-empty">This learning section is unavailable right now.</p>';
      }
    };
    if (target === 'visual-recordings') {
      import('@/lib/learn/recordings')
        .then((m) => {
          try {
            setEcgRecordings((m as unknown as { EM_ECG_RECORDINGS: unknown[] }).EM_ECG_RECORDINGS);
          } catch {
            /* recordings stay unavailable */
          }
          mount();
        })
        .catch(() => mount());
    } else {
      mount();
    }
    return () => {
      cancelled = true;
      host.innerHTML = '';
    };
  }, [target, title]);

  return <div ref={hostRef} />;
}
