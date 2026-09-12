'use client';

import { useEffect } from 'react';

/** Legacy `setTitle` parity: `Name — EM Pocket`. */
export function useDocTitle(name: string | null): void {
  useEffect(() => {
    document.title = name ? `${name} — EM Pocket` : 'EM Pocket — Emergency Medicine Reference';
  }, [name]);
}
