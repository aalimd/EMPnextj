/**
 * Legacy hash deep-link compatibility (`#chest-pain`, `#ecg~wellens`,
 * `#ecg-explorer~normal`, `#study~case`, `#shift~dyspnea`, `#learn~practice`).
 * The Next.js app uses path routes; this module translates old links so
 * bookmarks, shortcuts and PWA shortcuts keep working.
 */
import { resolveEcgTarget } from '@/data/ecgGuide';
import { getEcgFigureIds } from '@/lib/ecg/api';

let figureIds: Set<string> | null = null;

export function hashToPath(hash: string): string | null {
  const raw = hash.replace(/^#/, '');
  if (!raw) return null;
  const [id, target] = raw.split('~');
  switch (id) {
    case 'ecg': {
      if (!target) return '/ecg';
      if (!figureIds) {
        try {
          figureIds = new Set(getEcgFigureIds());
        } catch {
          figureIds = new Set<string>();
        }
      }
      if (figureIds.has(target)) return `/ecg/${target}`;
      if (target === 'patterns') return '/ecg#section-ecg-patterns';
      const section = resolveEcgTarget(target);
      return section ? `/ecg#section-${section}` : '/ecg';
    }
    case 'ecg-explorer':
      return target === 'practice' ? '/explorer/practice' : target ? `/explorer/${target}` : '/explorer';
    case 'study':
      return target ? `/study/${target}` : '/study';
    case 'learn': {
      if (!target) return '/study/learn';
      if (target.startsWith('case-')) return `/study/learn/case/${target.slice(5)}`;
      if (target.startsWith('module-')) return `/study/learn/module/${target.slice(7)}`;
      if (target.startsWith('visual-')) return `/study/learn/visual/${target.slice(7)}`;
      return `/study/learn/${target}`;
    }
    case 'shift':
      return target ? `/shift/${target}` : '/shift';
    case '':
      return '/';
    default:
      if (/^[a-z0-9-]+$/.test(id)) return target ? `/topic/${id}` : `/topic/${id}`;
      return null;
  }
}

/** Reverse mapping for canonical sharing of the legacy `#id~target` form. */
export function pathToHash(pathname: string): string {
  const parts = pathname.replace(/\/$/, '').split('/').filter(Boolean);
  if (parts.length === 0) return '#';
  const [head, tail] = parts;
  switch (head) {
    case 'topic':
      return tail ? `#${tail}` : '#';
    case 'ecg':
      return tail ? `#ecg~${tail}` : '#ecg';
    case 'explorer':
      return tail ? `#ecg-explorer~${tail}` : '#ecg-explorer';
    case 'study': {
      if (!tail) return '#study';
      if (parts[1] === 'learn') {
        const rest = parts.slice(2);
        if (rest.length === 0) return '#learn';
        if (rest[0] === 'case' && rest[1]) return `#learn~case-${rest[1]}`;
        if (rest[0] === 'module' && rest[1]) return `#learn~module-${rest[1]}`;
        if (rest[0] === 'visual' && rest[1]) return `#learn~visual-${rest[1]}`;
        return `#learn~${rest[0]}`;
      }
      return `#study~${tail}`;
    }
    case 'shift':
      return tail ? `#shift~${tail}` : '#shift';
    default:
      return '#';
  }
}
