import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { PrefsProvider } from '@/lib/preferences';
import { ChromeProvider } from '@/components/chrome/ChromeContext';
import Sidebar from '@/components/chrome/Sidebar';
import Topbar from '@/components/chrome/Topbar';
import HashBridge from '@/components/chrome/HashBridge';
import GlobalShortcuts from '@/components/chrome/GlobalShortcuts';
import DisclaimerDialog from '@/components/chrome/DisclaimerDialog';
import ServiceWorkerRegister from '@/components/chrome/ServiceWorkerRegister';
import ToastHost from '@/components/chrome/ToastHost';
import { RELEASE_TOKEN } from '@/lib/release';

export const metadata: Metadata = {
  title: 'EM Pocket — Emergency Medicine Reference',
  description:
    'A focused emergency medicine reference for chest pain, dyspnea, abdominal pain, and more. Rosen\u2019s-based frameworks for clinical learning and review.',
  manifest: `/manifest.json?v=${RELEASE_TOKEN}`,
  icons: {
    icon: [
      { url: `/icon.svg?v=${RELEASE_TOKEN}`, type: 'image/svg+xml' },
      { url: `/icon-192.png?v=${RELEASE_TOKEN}`, type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: `/apple-touch-icon.png?v=${RELEASE_TOKEN}`, sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EM Pocket',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#151d27' },
  ],
};

/**
 * Inline preference bootstrap — runs before first paint to avoid theme flash.
 * Reads the same `em-cps-prefs` key as the legacy shell (verbatim behavior).
 */
const BOOTSTRAP = `(function(){try{var ACCENTS=['emerald','ocean','violet','rose','amber','teal'];var p=JSON.parse(localStorage.getItem('em-cps-prefs')||'{}');var r=document.documentElement;var theme=p.theme||'light';r.setAttribute('data-theme',theme==='light'?'light':'dark');var accent=ACCENTS.indexOf(p.accent)!==-1?p.accent:'emerald';r.setAttribute('data-accent',accent);if(p.bold===true)r.setAttribute('data-weight','bold');if(p.scale)r.style.setProperty('--type-scale',String(p.scale));if(p.sidebar===true)r.classList.add('sidebar-collapsed');var meta=document.getElementById('themeColor');if(meta){meta.setAttribute('content',theme==='light'?'#ffffff':'#151d27');}}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" data-theme="light" data-accent="emerald">
      <head>
        <meta name="color-scheme" content="dark light" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="theme-color" content="#f6f7f9" id="themeColor" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: BOOTSTRAP }} />
      </head>
      <body>
        <PrefsProvider>
          <ChromeProvider>
            <a className="skip-link" href="#stage">Skip to main content</a>
            <Sidebar />
            <div className="main">
              <Topbar />
              <main className="stage" id="stage" tabIndex={-1} role="main" aria-label="Presentation content">
                {children}
              </main>
              <footer className="foot">
                <p>
                  Made by Dr. Alzahrani EM. ·{' '}
                  <a href="mailto:apps@aamd.sa?subject=EM%20Pocket%20feedback" title="Send feedback or suggestions">
                    Send feedback: apps@aamd.sa
                  </a>
                </p>
                <p>
                  <strong>EM Pocket</strong> — Built on the approach of <em>Rosen&apos;s Emergency Medicine</em> (10th ed., 2023)
                  and corroborating society guidance reviewed in September 2026 (Tintinalli&apos;s 9th ed., ACC/AHA, ESC, SSC, AAP, ACG, GINA/GOLD, ACEP). Educational reference —
                  always apply clinical judgment and institutional protocols.
                </p>
              </footer>
            </div>
            <DisclaimerDialog />
            <ToastHost />
            <HashBridge />
            <GlobalShortcuts />
            <ServiceWorkerRegister />
            <noscript>
              <p className="noscript">EM Pocket needs JavaScript enabled to show presentations.</p>
            </noscript>
          </ChromeProvider>
        </PrefsProvider>
      </body>
    </html>
  );
}
