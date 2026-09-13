# EM Pocket (Next.js) — Cloudflare Pages deployment

The migrated app is a **static export**: `next build` writes plain HTML/CSS/JS
to `out/`. No adapter, no Pages Functions, no Worker, no database, no bindings,
no environment variables, no Node.js runtime APIs.

## Exact settings

| Setting | Value |
| --- | --- |
| Package manager | npm (lockfile: `package-lock.json`) |
| Install command | `npm ci` (`npm install` works identically) |
| Development command | `npm run dev` (`next dev`, local only — never deploy from this) |
| Build command | `npm run build` (`next build`; runs lint + typecheck + static prerender of 211 pages) |
| Deploy command | `npx wrangler deploy` (uses `wrangler.jsonc` → `out/`). Do **not** let Wrangler run OpenNext auto-setup. |
| Build output directory | `out` (**never** `.next`) |
| Framework preset | None / static assets (or Next.js Static HTML Export). Not OpenNext, not Workers Node runtime. |
| Root directory | Repository root (or the `EMPnotPaid2` directory if imported as a subfolder) |
| Node.js version | 18+ (tested on 22; set `NODE_VERSION=22` if the dashboard requires it) |
| Environment variables / bindings | None |

Key config (`next.config.js`): `output: 'export'`, `trailingSlash: true`,
`images: { unoptimized: true }`. `wrangler.jsonc` publishes `./out` as static
assets. If Wrangler has no config, `npx wrangler deploy` auto-detects Next.js
and tries OpenNext (Next 15+ only) — that path is wrong for this app.

Every route is prerendered at build time
(`generateStaticParams` covers all 45 topics, 27 ECG figures, 47 explorer
cases, 12 short cases, 6 evolving cases, 6 modules, 5 visuals, 45 shift views),
so **refreshing or directly opening any route never produces a Cloudflare 404**
— each URL is a real static file (`/topic/chest-pain/` → `out/topic/chest-pain/index.html`).

## Headers and caching

`public/_headers` is copied to `out/_headers` and supplies Pages response
headers (security values match the legacy static bundle):

- HTML/JS/CSS/JSON: `no-cache, must-revalidate` (shell and content update on deploy)
- `/_next/static/*`: `public, max-age=31536000, immutable` (content-hashed by Next)
- PNG/SVG/icons: `public, max-age=604800` (7-day browser cache, as before)
- `/sw.js`: `no-cache, no-store, must-revalidate`
- `/manifest.json`: `application/manifest+json`

## PWA / offline

- `public/manifest.json` + icons in `public/` (same names/paths as the legacy bundle).
- `public/sw.js` implements navigation network-first with cache fallback,
  cache-first for `/_next/static/*` and icons. Cache names encode the exact
  installation path (`em-cps-scope-<path>-v171`); cleanup touches only that
  namespace — saved progress and other apps are never modified.
- Release rollover: bump `RELEASE_TOKEN`/`CACHE_VERSION` in `src/lib/release.ts`
  **and** `CACHE_VERSION` in `public/sw.js` **and** the `?v=` queries in
  `public/manifest.json` together, then rebuild and redeploy.

## Known limitations

- The app must be served from the **site root** (service worker is registered
  at `/sw.js`; manifest scope is `./`). Subdirectory hosting would require a
  `basePath`/`assetPrefix` configuration, which is intentionally not set.
- The 884 KB PTB-XL recording bank lazy-loads only when the
  `study/learn/visual/recordings` visual opens (dynamic `import()` chunk).
- `next dev` hot-reload is for development only; Pages compatibility was
  verified with `npm run build` + the static `out/` directory served as-is
  (200 on all routes, offline revisits render, no console errors).
- Physical-device install testing was not performed in this environment
  (no devices attached); installability prerequisites (manifest, icons,
  standalone display, theme-color, SW offline) are verified locally.
