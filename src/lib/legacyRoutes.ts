/**
 * Legacy hash deep-link compatibility (`#chest-pain`, `#ecg~wellens`,
 * `#ecg-explorer~normal`, `#study~case`, `#shift~dyspnea`, `#learn~practice`).
 * The Next.js app uses path routes; this module translates old links so
 * bookmarks, shortcuts, PWA shortcuts and injected-HTML hrefs keep working.
 */
import { resolveEcgTarget } from '@/data/ecgGuide';
import { getEcgFigureIndexIds } from '@/data/ecgFigureIndex';
import { getTopic } from '@/data/topics';

let figureIds: Set<string> | null = null;

function figureIdSet(): Set<string> {
  if (!figureIds) figureIds = new Set(getEcgFigureIndexIds());
  return figureIds;
}

/** In-page Next hashes and element ids — never treat these as topic routes. */
function isInPageHash(raw: string): boolean {
  return (
    raw.startsWith('section-') ||
    raw === 'stage' ||
    raw === 'presentationLibrary' ||
    raw === 'filterChips'
  );
}

/**
 * Translate a legacy `#hash` (or a stored resume token without `#`) to a
 * canonical App Router path. Returns `null` for in-page hashes and unknown
 * ids so the browser (or a section scroller) can handle them.
 */
export function hashToPath(hash: string): string | null {
  // `location.hash` is '' when there is no fragment — do not treat that as home.
  // An explicit `href="#"` (raw empty *after* stripping '#') is the library link.
  if (!hash) return null;
  const raw = String(hash).replace(/^#/, '');
  if (raw === '') return '/';
  if (isInPageHash(raw)) return null;
  const [id, target] = raw.split('~');
  switch (id) {
    case 'ecg': {
      if (!target) return '/ecg';
      if (figureIdSet().has(target)) return `/ecg/${target}`;
      if (target === 'patterns') return '/ecg#section-ecg-patterns';
      const section = resolveEcgTarget(target);
      return section ? `/ecg#section-${section}` : '/ecg';
    }
    case 'ecg-explorer':
      return target === 'practice' ? '/explorer/practice' : target ? `/explorer/${target}` : '/explorer';
    case 'study': {
      if (!target) return '/study';
      if (target.startsWith('case-')) return `/study/case/${target.slice(5)}`;
      return `/study/${target}`;
    }
    case 'learn': {
      if (!target) return '/study/learn';
      if (target.startsWith('case-')) return `/study/learn/case/${target.slice(5)}`;
      if (target.startsWith('module-')) return `/study/learn/module/${target.slice(7)}`;
      if (target.startsWith('visual-')) return `/study/learn/visual/${target.slice(7)}`;
      return `/study/learn/${target}`;
    }
    case 'shift':
      return target && getTopic(target) ? `/shift/${target}` : '/shift';
    default:
      if (getTopic(id)) return target ? `/topic/${id}#section-${target}` : `/topic/${id}`;
      return null;
  }
}

function withTrailingSlash(path: string): string {
  const hashAt = path.indexOf('#');
  const pathname = hashAt < 0 ? path : path.slice(0, hashAt);
  const hash = hashAt < 0 ? '' : path.slice(hashAt);
  if (pathname === '/') return `/${hash}`;
  const slashed = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return `${slashed}${hash}`;
}

/** Rewrite `href="#legacy"` in injected HTML to canonical paths when known. */
export function rewriteLegacyHrefs(html: string): string {
  return html.replace(/href="#([^"]*)"/g, (all, raw: string) => {
    const next = hashToPath(`#${raw}`);
    return next ? `href="${withTrailingSlash(next)}"` : all;
  });
}

/** Reverse mapping for canonical sharing of the legacy `#id~target` form. */
export function pathToHash(pathname: string): string {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (parts.length === 0) return '#';
  const [head, tail, third] = parts;
  switch (head) {
    case 'topic':
      return tail ? `#${tail}` : '#';
    case 'ecg':
      return tail ? `#ecg~${tail}` : '#ecg';
    case 'explorer':
      return tail ? `#ecg-explorer~${tail}` : '#ecg-explorer';
    case 'study': {
      if (!tail) return '#study';
      if (tail === 'learn') {
        const rest = parts.slice(2);
        if (rest.length === 0) return '#learn';
        if (rest[0] === 'case' && rest[1]) return `#learn~case-${rest[1]}`;
        if (rest[0] === 'module' && rest[1]) return `#learn~module-${rest[1]}`;
        if (rest[0] === 'visual' && rest[1]) return `#learn~visual-${rest[1]}`;
        return `#learn~${rest[0]}`;
      }
      if (tail === 'case') return third ? `#study~case-${third}` : '#study~case';
      return `#study~${tail}`;
    }
    case 'shift':
      return tail ? `#shift~${tail}` : '#shift';
    default:
      return '#';
  }
}

export function normalizePathname(pathname: string): string {
  const s = pathname.replace(/\/+$/, '');
  return s === '' ? '/' : s;
}
