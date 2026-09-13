'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hashToPath, normalizePathname } from '@/lib/legacyRoutes';

/**
 * Legacy deep-link bridge: translates old `#topic` / `#ecg~x` / `#study~y`
 * / `#shift~z` / `#ecg-explorer~c` / `#learn~…` links (bookmarks, PWA
 * shortcuts, shared URLs, and hrefs inside ported HTML) into canonical
 * Next.js routes.
 *
 * In-page hashes (`#section-*`, `#stage`, `#presentationLibrary`) are left
 * alone so topic/ECG section jumpers keep working.
 */
export default function HashBridge(): null {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const go = (path: string, replace: boolean): void => {
      const url = new URL(path, window.location.origin);
      const here = normalizePathname(window.location.pathname);
      const there = normalizePathname(url.pathname);
      if (here === there) {
        if (url.hash && url.hash !== window.location.hash) {
          window.location.hash = url.hash;
        }
        return;
      }
      if (replace) router.replace(path);
      else router.push(path);
    };

    const fromLocation = (replace: boolean): void => {
      const path = hashToPath(window.location.hash);
      if (path) go(path, replace);
    };

    fromLocation(true);

    const onHash = (): void => fromLocation(true);
    const onClick = (e: MouseEvent): void => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      const path = hashToPath(a.getAttribute('href') || '');
      if (!path) return;
      e.preventDefault();
      go(path, false);
    };

    window.addEventListener('hashchange', onHash);
    document.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('hashchange', onHash);
      document.removeEventListener('click', onClick);
    };
  }, [router, pathname]);

  return null;
}
