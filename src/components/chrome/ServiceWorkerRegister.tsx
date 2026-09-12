'use client';

import { useEffect } from 'react';
import { RELEASE_TOKEN } from '@/lib/release';
import { useChrome } from '@/components/chrome/ChromeContext';

/** PWA service-worker registration (legacy registration-flow parity). */
export default function ServiceWorkerRegister(): null {
  const { showToast } = useChrome();

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onLoad = (): void => {
      const hadController = !!navigator.serviceWorker.controller;
      // Absolute path: Next.js routes are nested (`/topic/x/`), so a relative
      // `./sw.js` would resolve under the current route. Root hosting is
      // required (Cloudflare Pages default); see CLOUDFLARE.md.
      navigator.serviceWorker
        .register(`/sw.js?v=${RELEASE_TOKEN}`)
        .then((registration) => {
          if (registration.waiting) showToast('An updated offline bundle is ready. Refresh when convenient.');
          registration.addEventListener('updatefound', () => {
            const worker = registration.installing;
            if (worker) {
              worker.addEventListener('statechange', () => {
                if (worker.state === 'installed' && navigator.serviceWorker.controller) {
                  showToast('An updated offline bundle is ready. Refresh when convenient.');
                }
              });
            }
          });
          navigator.serviceWorker.addEventListener(
            'controllerchange',
            () => {
              if (hadController) showToast('Offline content updated. Refresh to use the latest interface.');
            },
            { once: true },
          );
        })
        .catch(() => {
          showToast('Offline setup could not be completed. The app remains available online.');
        });
    };
    // Hydration can finish after `load` already fired; register immediately then.
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
    }
    return () => window.removeEventListener('load', onLoad);
  }, [showToast]);

  return null;
}
