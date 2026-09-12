# EMPocket → TypeScript + React + Next.js — migration map

Source language/architecture: **vanilla JavaScript (IIFE `window.*` globals) +
static HTML shell + single 5,298-line CSS file. No build step, no framework.**
Hash-based routing (`#topic`, `#ecg~x`, `#study~y`, `#shift~z`,
`#ecg-explorer~c`, `#learn~…`), `localStorage` persistence, static PWA.

Target: **TypeScript (strict) + React 18 + Next.js 14 App Router**, static
export (`out/`) for Cloudflare Pages.

## Module map

| Original file / module | New location | Status | Notes |
| --- | --- | --- | --- |
| `index.html` shell | `src/app/layout.tsx` + `src/components/chrome/*` | Done | Same markup/CSS classes; inline prefs bootstrap preserved |
| `assets/app.css` (5,298 lines) | `src/styles/globals.css` | Done | Byte-verbatim; visual identity unchanged |
| `assets/data.js` → `CP_DATA` (45 topics) | `src/generated/CP_DATA.json` → `src/data/topics.ts` | Done | Verbatim content, typed `ClinicalTopic` |
| `assets/data.js` → `ECG_DATA` (7 steps, 18 patterns) | `src/generated/ECG_DATA.json` → `src/data/ecgGuide.ts` | Done | Verbatim content, typed `EcgGuide` |
| `assets/evidence.js` | `src/generated/CLINICAL_EVIDENCE.json` → `src/data/evidence.ts` | Done | Verbatim; `evidenceFor()` helper |
| `assets/app.js` → `GROUPS/RELATED/PATIENT_CONTEXTS/CP_COLOR_SVG` | `src/lib/libraryMeta.ts` | Done | Verbatim literals, extractor in `scripts/` |
| `assets/app.js` → library/home | `src/app/page.tsx` | Done | Groups, severity + patient filters, reviewed/saved badges, workspace entry, study dashboard, starter track |
| `assets/app.js` → presentation view | `src/components/topic/*`, `src/app/topic/[id]/page.tsx` | Done | All 10 sections, red-flag checklist, recall, notes, guided reasoning, related, pager |
| `assets/app.js` → shift view | `src/components/shift/ShiftView.tsx`, `src/app/shift/**` | Done | Same 5-block sheet + picker |
| `assets/app.js` → study queue/cases | `src/components/study/*`, `src/app/study/**` | Done | due/saved/case + 12 short cases |
| `assets/app.js` → search | `src/lib/search.ts` + `Topbar` combobox | Done | Same index entries, substring rank, 12-hit cap, `/`-to-focus, arrows/enter/esc |
| `assets/app.js` → prefs/disclaimer/toast/keys | `src/lib/preferences.tsx`, `DisclaimerDialog`, `ToastHost`, `GlobalShortcuts` | Done | Same keys (`em-cps-prefs`, `em-cps-disclaimer-agreed`), stepped scales, H/S/E/V/`[`/`]`/ECG-step arrows |
| `assets/app.js` → `ECG_WAVE_INFO` | `src/lib/ecg/waveInfo.ts` | Done | Verbatim 30 wave explainers |
| `assets/ecg-engine.js` (engine v2.0.0-phase2) | `src/lib/ecg/engine.ts` | Done | Verbatim port; geometry checks 9/9; figures byte-identical (see below) |
| `assets/ecg-svg.js` (27 figures) | `src/lib/ecg/svgLibrary.ts` | Done | Verbatim; all 27 keys match legacy dump |
| `assets/ecg-case-tracings.js` | `src/lib/ecg/caseTracings.ts` (`applyCaseTracings()`) | Done | Same library patch, now explicit call order |
| `assets/ecg-interactive.js` | `src/lib/ecg/interactive.ts` + `EcgFigure.tsx` + workbench | Done | Same render/measure/signal/findingTargets; hotspot inspector + red-circle marks; full workbench modal |
| `assets/ecg-curriculum.js` (39 cases) | `src/lib/ecg/curriculum.ts` + `src/generated/ECG_CURRICULUM.json` | Done | Verbatim |
| `assets/ecg-explorer.js` (47 cases) | `src/lib/ecg/explorer.ts` + `ExplorerCaseView.tsx` | Done | `build()` reused directly; findings/highlights/detail crop/practice/compare/pathways/progress/practice-locate all reimplemented |
| `assets/student-learning.js` (12 cases) | `src/lib/learn/studentLearning.ts` + `src/generated/STUDENT_CASES.json` → `src/data/studentCases.ts` | Done | Cases verbatim; auto-enhance disabled (React owns DOM); `remember/rate/read` reused |
| `assets/student-learning.js` glossary | `src/data/glossary.ts` | Done | Verbatim 12 abbreviations |
| `assets/em-learning-data.js` | `src/generated/EM_LEARNING_DATA.json` → `src/data/emLearning.ts` | Done | Verbatim (6 cases, 6 modules) |
| `assets/em-learning.js` workspace | `src/lib/learn/emLearning.ts` + `LearnWorkspace.tsx` | Done | `mount()` reused; recordings lazy (`setEcgRecordings`) |
| `assets/ecg-recordings.js` (PTB-XL 905 KB) | `src/lib/learn/recordings.ts` | Done | Verbatim; dynamic-import chunk, loads only on the recordings visual |
| `manifest.json` | `public/manifest.json` | Done | Same fields; shortcuts now use canonical path routes (hash links redirect) |
| `sw.js` (v171) | `public/sw.js` | Done | Rewritten for `out/` (navigation network-first, `/_next/static` cache-first); same cache namespace discipline |
| `_headers` / `.htaccess` | `public/_headers` | Done | Same policies, mapped to Next output paths |
| `assets/icon-*.png`, `icon.svg`, `apple-touch-icon.png` | `public/` | Done | Unchanged files |
| `tests/*.test.js` (96 legacy tests) | untouched | Done | 96/96 pass (legacy bundle unmodified) |
| New verification | `scripts/smoke.cjs`, `scripts/interact.cjs`, `scripts/pwa-a11y.cjs` | Done | See parity table |

## Ordering fix discovered during migration

Legacy scripts executed `ecg-case-tracings` **before** `ecg-interactive`
(whose top-level `render()` calls require populated `traceSpec`s). ES module
evaluation inverted that order and threw `Unsupported ECG lane` at import
time. Fixed by calling `applyCaseTracings()` at the top of `interactive.ts`
(documented in `scripts/port-ecg.mjs`). No clinical logic changed.

## Functionality parity

| Original feature | Migrated implementation | Status | Notes |
| --- | --- | --- | --- |
| Library (45 topics, 6 groups) | `/` + `/topic/[id]` (static) | PASS | Verified all 45 prerender |
| Clinical content (all sections) | `TopicView` | PASS | 10 sections incl. med-safety, reassessment, evidence context |
| Navigation (sidebar/topbar) | `Sidebar`/`Topbar` | PASS | Same classes; collapse persisted; Practice→workspace (legacy target) |
| Search (topics/ECG/explorer/learn) | `search.ts` + combobox | PASS | Same entries/rank/cap; keyboard nav verified in browser |
| Severity + patient filters | `ChromeContext` | PASS | Session-scoped as legacy |
| Study queue/saved/cases | `/study/**` | PASS | Same spaced intervals 1/3/7/14; same store shape |
| Evolving cases/modules/visuals/recordings/progress/backup | `/study/learn/**` via ported `EM_LEARNING.mount` | PASS | Cards render (6); recordings lazy; backup export/import logic verbatim |
| ECG Guide (7 steps, 18 patterns, categories) | `/ecg` | PASS | All figures render; category+severity filters; killer index |
| ECG Explorer (47 cases) | `/explorer/**` | PASS | `build()` output reused; findings, red marks, detail crop, zoom, practice, compare, pathways, progress verified in browser |
| Interactive ECGs (hotspots, red circles, workbench) | `EcgFigure` + `ECG_INTERACTIVE.open` | PASS | Hotspot inspector, ellipse marks, anno/compare/expand, calipers workbench verified |
| ECG rendering/morphology | Ported engine + library | PASS | All 27 figure SVG/caption/title **byte-identical** to legacy dump; geometry checks 9/9 |
| Deep links/bookmarks | Path routes + `HashBridge` | PASS | `#chest-pain`, `#ecg-explorer~normal`, `#study~case`, `#learn~*`, `#shift~*` all redirect (browser-verified) |
| Refresh/back-forward on valid routes | Static files per route | PASS | 211 pages; direct-URL fetch 200s verified |
| Preferences (theme/accent/scale/bold/sidebar) | `preferences.tsx` + bootstrap | PASS | Same `em-cps-prefs` key/stepped scales; no-flash bootstrap; dark mode verified |
| Disclaimer gate + notice page | `DisclaimerDialog` + `/disclaimer` | PASS | Same `em-cps-disclaimer-agreed` key; gate verified |
| localStorage persistence (all keys) | Same keys/shapes | PASS | `em-cps-learning`, `em-student-progress`, `em-ecg-learning-v1`, `em-ecg-practice-v1`, `em-workspace-progress-v1`, focus key |
| PWA installability | manifest + icons + SW | PASS | manifest 200; SW controls page; icons present |
| Offline | `public/sw.js` | PASS | Offline revisits of `/topic/*` + `/ecg` render (browser-verified) |
| Accessibility | Same semantics + React a11y | PASS | Skip link, h1, lang, alt, button names checked; 0 overflow 320–1280px on 6 pages |
| SEO/metadata | Per-route titles/descriptions | PASS | Titles `Name — EM Pocket`; descriptions from content |
| Keyboard shortcuts | `GlobalShortcuts` | PASS | H/S/E/V/`[`/`]` (topics + ECG steps), `/` search |
| Print/PDF | Sidebar button → `window.print` | PASS | Print CSS is the verbatim stylesheet |

## Known deviations (intentional, documented)

1. Explorer “Enlarge ECG” opens a same-view modal instead of the legacy
   full-workspace `<dialog>` re-render (all workspace controls remain on the page).
2. Manifest shortcuts use canonical path routes instead of `./#hash` URLs
   (old hash shortcuts redirect via the bridge).
3. Study dashboard is new at `/study` (union of legacy entry points); the
   topbar Practice button keeps its legacy target (evolving cases).
4. `next dev` was used only for development; compatibility is claimed from
   `next build` + static `out/` only.
5. Physical-device install testing was not performed (no devices attached).

## Medical content

**NONE changed.** All clinical strings are verbatim ports (verified by
byte-comparison for the ECG library; JSON extraction for topic/guide/learning
data). No questionable-content edits were made during migration.
