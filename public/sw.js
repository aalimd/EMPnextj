/* EM Pocket service worker — Next.js static-export Ghe offline shell.
 *
 * Strategy (no build-time manifest needed):
 * - Navigations: network-first, cache the visited page; offline falls back to
 *   the cached page, then the app shell (`/`).
 * - `/_next/static/*` (hashed, immutable): cache-first.
 * - Icons/manifest (versioned `?v=`): cache-first.
 * - Everything else: network-first with cache fallback for GET same-origin.
 *
 * Safety (legacy parity): cache names encode the exact installation path;
 * cleanup touches only this namespace; saved progress (localStorage) and
 * other applications' caches/workers are never modified.
 */
const CACHE_VERSION = 'v172';
const SCOPE_KEY = encodeURIComponent(new URL(self.registration.scope).pathname);
const CACHE_PREFIX = 'em-cps-scope-' + SCOPE_KEY + '-';
const PAGES_CACHE = CACHE_PREFIX + 'pages-' + CACHE_VERSION;
const STATIC_CACHE = CACHE_PREFIX + 'static-' + CACHE_VERSION;

const APP_SHELL = new URL('./', self.registration.scope).href;

function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request).catch(() => undefined);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.status === 200 && response.type === 'basic') {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function networkFirst(request, cacheName, fallback) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === 'basic') {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch (e) {
    const cached = await cache.match(request).catch(() => undefined);
    if (cached) return cached;
    if (fallback) {
      const shell = await cache.match(fallback).catch(() => undefined);
      if (shell) return shell;
    }
    throw e;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(PAGES_CACHE)
      .then((cache) => cache.add(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.indexOf(CACHE_PREFIX) === 0 && key !== PAGES_CACHE && key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!isSameOrigin(url)) return;
  if (url.pathname.endsWith('/sw.js')) return;

  // Next.js App Router flight payloads (`index.txt?_rsc=`). Never serve the
  // HTML app shell for these — that corrupts client navigation.
  if (url.searchParams.has('_rsc') || /\.txt$/.test(url.pathname)) {
    event.respondWith(fetch(request));
    return;
  }

  if (url.pathname.indexOf('/_next/static/') === 0) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(networkFirst(request, PAGES_CACHE, APP_SHELL));
    return;
  }
  if (request.destination === 'image' || request.destination === 'font' || url.pathname.indexOf('/manifest.json') === 0) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }
  event.respondWith(networkFirst(request, PAGES_CACHE, APP_SHELL));
});
