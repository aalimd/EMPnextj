'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { hashToPath } from '@/lib/legacyRoutes';

/**
 * Legacy deep-link bridge: translates old `#topic` / `#ecg~x` / `#study~y`
 * / `#shift~z` / `#ecg-explorer~c` links (bookmarks, PWA shortcuts, shared
 * URLs) into canonical Next.js routes. Runs on mount and on hash changes.
 */
export default function HashBridge(): null {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const translate = (): void => {
      const { hash } = window.location;
      if (!hash || hash.length < 2) return;
      const path = hashToPath(hash);
      if (path) {
        window.history.replaceState(null, '', path);
        router.replace(path);
      }
    };
    translate();
    window.addEventListener('hashchange', translate);
    return () => window.removeEventListener('hashchange', translate);
  }, [router, pathname]);

  return null;
}
