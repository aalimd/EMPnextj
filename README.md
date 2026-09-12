> **Next.js migration (in progress, same folder):** the TypeScript + React +
> Next.js App Router implementation lives in `src/` and builds to `out/` for
> Cloudflare Pages. See the [migration map](docs/MIGRATION-MAP.md) and
> [Cloudflare Pages settings](docs/CLOUDFLARE-PAGES-NEXT.md). The legacy static
> bundle (`index.html`, `assets/`, `sw.js`) remains in place as the
> parity reference and is not published by Pages (publish directory: `out`).
>
> Latest learning update: [complete experience, verification and rollback](docs/COMPLETE-LEARNING-EXPERIENCE-2026-09-10.md).

Latest code and hosting verification: [10 September release audit](docs/RELEASE-VERIFICATION-2026-09-10.md).

ECG controls: [single selection marker and consolidated viewer](docs/ECG-CONTROLS-2026-09-09.md).

ECG waveform review: [9 September corrections and verification](docs/ECG-ACCURACY-2026-09-09.md).

# EM Pocket deployment — Hostinger and Cloudflare Pages

Student learning improvements: [implementation and verification](docs/STUDENT-UX-IMPLEMENTATION-2026-09-07.md), including authored cases, mobile ECG detail, search, progress and reading controls.

This is a self-contained static PWA: there is no build step, database, PHP runtime, or environment file.

New main section: [ECG Explorer](docs/ECG-EXPLORER.md), with 47 teaching examples and 143 guided findings, grouped navigation, zoom and practice mode. All ECGs now use pink paper backgrounds.

ECG interaction coverage: [27-figure interactive audit](docs/ECG-INTERACTIVITY-2026-09-07.md), including guided explanations, red circles and regression checks.

ECG guide (route `#ecg`): the current [clinical, ECG and code audit](docs/CONTENT-AUDIT-2026-09-07.md) covers all 27 library figures, corrections and remaining limitations. The [5 September ECG audit](docs/ECG-AUDIT-2026-09-05.md) is historical. Technical background: programmer notes, SVG/image inventory, and clinical caveats are in [docs/ECG-SECTION.md](docs/ECG-SECTION.md). Read that before changing drawings or ACS wording.

## Hostinger deployment

1. In hPanel, open **Websites → Manage → File Manager** and open the target site's `public_html` directory (or the subdirectory used by the intended subdomain).
2. Upload the runtime files (exclude `dev/`, `tests/`, `.git/` and audit documents), including the hidden [`.htaccess`](.htaccess) file and the full `assets` directory. `index.html` must sit directly in that web root.
3. Enable SSL / **Force HTTPS** in hPanel before testing. Service workers and installable PWAs require HTTPS in production.
4. If Hostinger caching is enabled, flush it once after upload. Then test the site in a private window, including a direct presentation link such as `https://your-domain.example/#dyspnea`.

## Cloudflare Pages deployment

Use the same static runtime files. `_headers` supplies Pages response headers; Apache uses `.htaccess`. Neither configuration file executes application code. No `_redirects`, Wrangler configuration, Pages Functions, Worker, database, dependencies or environment variables are needed. Hash fragments are handled by the app and are not sent to the server.

Recommended Git integration settings (repository root contains `index.html`):

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | `main` (the current repository branch) |
| Root directory | Leave blank (repository root) |
| Build command | `exit 0` (no-op; no compilation or dependency installation) |
| Build output directory | `.` |
| Environment variables / bindings | None |

For a completely build-free upload, use **Pages Direct Upload** with a folder containing `index.html`, `sw.js`, `manifest.json`, `_headers`, `.htaccess` and the full `assets/` directory. Exclude `.git/`, `dev/`, `tests/`, `docs/` and local/editor files. Keep `index.html` at the upload root, not inside another containing directory. The same runtime folder can be uploaded to Hostinger. Do not upload the separate EM-P paid application.

Git integration with output `.` can also publish tracked development/tests/documentation files; they are not runtime dependencies. Use the runtime-only Direct Upload folder when those files should stay unpublished. No build-time filtering system has been added.

Pages serves this upload at the site root. Hostinger can serve the same files at a root or subdirectory. All app, manifest and service-worker URLs remain relative. The `_headers` paths describe the Pages site-root layout; mounting the app beneath a Pages path would require corresponding header-rule prefixes. Hostinger can ignore `_headers` (or omit it from its upload); Pages does not interpret `.htaccess`.

Both hosts revalidate the shell, JavaScript, CSS and manifest; `sw.js` additionally uses `no-store`. Image responses retain the existing seven-day browser cache. Security values match, including the existing inline-script/style and Cloudflare Analytics allowances. No `unsafe-eval` or broad CORS allowance was added. Host-managed headers, redirects and CDN behavior can differ; do not add a Cache Everything rule that overrides these policies.

See Cloudflare's official [static HTML settings](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [header syntax](https://developers.cloudflare.com/pages/configuration/headers/), and [serving/caching behavior](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Release and offline updates

The current asset token is `20260911-streamline-r1`; `CACHE_VERSION` is `v171` in `sw.js`. When changing shipped assets, update the token in `index.html`, `manifest.json`, `sw.js`, the registration in `assets/app.js`, and local preview references, then increment the worker cache version. Upload the release together. Configuration-only header changes do not need a worker version bump.

The worker precaches the canonical `./` shell because Pages redirects `/index.html` to `/`. Direct hash routes and offline `/index.html` requests fall back to that shell. Required asset failure or an HTML fallback returned instead of required JavaScript/CSS prevents a new worker from activating; optional icon failure does not prevent core offline use. A new worker claims the app and notifies users to refresh. The worker handles only this app's entry points and shipped asset paths, including at the domain root. New cache names encode the exact installation path, preserving case and punctuation. Cleanup touches only that exact namespace; it does not clear saved progress or other apps' caches. Ambiguous legacy cache names are intentionally retained during this one-time naming change.

Do not change the installation origin/path when replacing an existing Hostinger deployment if its installed-app identity and local progress must be preserved. Moving to a different origin creates a separate PWA/storage context; this release does not migrate user data between domains.

## Release checklist

- Open the root page and one direct hash link.
- Check search, the severity chips, a red-flag checklist, theme controls, and Export PDF.
- In browser DevTools, confirm `manifest.json` and `sw.js` return HTTP 200 with no console errors.
- After the worker activates, disconnect and reopen `/#ecg`, `/#ecg-explorer~normal`, `/#dyspnea` and `/index.html#study` (prepend the installation directory on Hostinger).
- Verify an update from the previous installed release, refresh after the update message, and confirm saved progress remains.
- On actual Android/iOS devices, verify installation, icons, standalone launch, touch ECG controls and offline reopening.
- Inspect response headers for `/`, `sw.js`, `manifest.json`, `assets/app.js`, `assets/app.css` and an icon. Confirm there is only one effective Cache-Control policy per response and no server/cache-rule overrides.

## Local verification

Run `node --test tests/*.test.js`. Deployment tests check local references, PNG dimensions, release-token consistency, header parity and worker offline/install behavior. The rule matcher is a local model, not Cloudflare’s production parser. Serve `dev/explorer.html` locally for ECG interaction checks. The older `dev/audit.html` uses `new Function` and is blocked by the production CSP; do not weaken CSP to run it. See [deployment verification](docs/DEPLOYMENT-VERIFICATION-2026-09-10.md) for results and manual checks.

The latest seven-area learning and UI review, recorded-ECG attribution, verification scope and reversible source patch are documented in [UI/UX completion](docs/UI-UX-COMPLETION-2026-09-10.md).
