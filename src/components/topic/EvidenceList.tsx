import { EVIDENCE, evidenceFor } from '@/data/evidence';

/** Reference links for a presentation (legacy `evidenceHtml` parity). */
export default function EvidenceList({ topicId }: { topicId: string }): JSX.Element {
  const topics = EVIDENCE.topics[topicId];
  const links = evidenceFor(topicId);
  if (!Array.isArray(topics)) {
    return <p className="evidence-note">Foundational references below. No separate topic-specific guideline check is recorded here.</p>;
  }
  return (
    <>
      <p className="evidence-note">
        Selected guidance · source check {EVIDENCE.checked}. These {topics.length} source links support selected
        teaching points, not a complete review of this topic. Check population, setting and local protocol before
        applying a recommendation.
      </p>
      <ul className="refs">
        {links.map((l) => (
          <li key={l.key}>
            <a href={l.url} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
