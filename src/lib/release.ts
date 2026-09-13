/**
 * Single release token for cache-busting shipped PWA assets.
 * When changing shipped assets, update this token AND the service-worker
 * CACHE_VERSION in `public/sw.js` together, then rebuild and redeploy.
 * (Replaces the legacy `?v=` scatter across index.html/manifest/sw.js/app.js.)
 */
export const RELEASE_TOKEN = '20260913-console-r1';
export const CACHE_VERSION = 'v172';
