'use client';

import { useChrome } from './ChromeContext';

/** Screen-reader + visual toast region (legacy `#toast` parity). */
export default function ToastHost(): JSX.Element | null {
  const { toast } = useChrome();
  if (!toast) return null;
  return (
    <div className="toast show" id="toast" role="status">
      {toast}
    </div>
  );
}
