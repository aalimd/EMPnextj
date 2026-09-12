import { CP_COLOR_SVG } from '@/lib/libraryMeta';
import { TOPICS } from '@/data/topics';

/** Per-presentation icon: verbatim legacy color SVG, emoji fallback (legacy parity). */
export default function TopicIcon({ id, large, side }: { id: string; large?: boolean; side?: boolean }): JSX.Element {
  const svg = CP_COLOR_SVG[id];
  const inner = svg ? (
    <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} style={{ display: 'contents' }} />
  ) : (
    (() => {
      const found = TOPICS.find((t) => t.id === id);
      return <span className="emoji-ico" aria-hidden="true">{found?.icon ?? '•'}</span>;
    })()
  );
  if (side) {
    return (
      <i className="ico" data-cat={id} aria-hidden="true">
        {inner}
      </i>
    );
  }
  return (
    <span className={large ? 'cp-ico-lg' : 'cp-ico'} data-cat={id} aria-hidden="true">
      {inner}
    </span>
  );
}
