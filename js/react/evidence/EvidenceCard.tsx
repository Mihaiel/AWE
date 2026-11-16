// ---------------------------------------------------------------------
// EVIDENCE CARD - presentational, Exercise 5 Demo 1
// ---------------------------------------------------------------------
// Same markup/classes as the vanilla renderEvidenceCardHTML() in
// js/views/evidence.ts. The vanilla version builds this as one big
// delegated listener on the whole grid (container.addEventListener
// ("click", handleEvidenceListClick)), re-attached every single time
// renderEvidenceList() runs, then manually checks event.target.dataset
// .action / .closest(".evidence-card") to figure out what was actually
// clicked. React doesn't need any of that: this card owns two plain
// onClick handlers, one per element, no delegation, no dataset
// attributes, no listener re-registration to work around (see
// EXERCISE_5.md Demo 1, question 2).
import type { Evidence } from "../../types.js";
import { formatDate, getStatusBadgeClass, getRelevanceBadgeClass } from "../../utils.js";

interface EvidenceCardProps {
  evidence: Evidence;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onOpen: (id: string) => void;
}

export default function EvidenceCard({
  evidence,
  isBookmarked,
  onToggleBookmark,
  onOpen,
}: EvidenceCardProps) {
  return (
    <div className="evidence-card" onClick={() => onOpen(evidence.id)}>
      <button
        type="button"
        className={"bookmark-btn" + (isBookmarked ? " active" : "")}
        aria-label={`Toggle bookmark for ${evidence.title}`}
        onClick={(event) => {
          // Stops the click from also reaching the card's own onOpen,
          // same reason the vanilla handler called event.stopPropagation()
          // for the bookmark button specifically.
          event.stopPropagation();
          onToggleBookmark(evidence.id);
        }}
      >
        <span className="bookmark-icon">{isBookmarked ? "★" : "☆"}</span>
      </button>
      <h3>{evidence.title}</h3>
      <div className="evidence-meta">
        {evidence.id} &middot; {evidence.type} &middot; {formatDate(evidence.timestamp)}
      </div>
      <div className="evidence-summary">{evidence.summary}</div>
      {evidence.tags.includes("critical") && <span className="badge badge-critical">Critical</span>}
      <span className={"badge " + getStatusBadgeClass(evidence.status)}>{evidence.status}</span>
      <span className={"badge " + getRelevanceBadgeClass(evidence.relevance)}>
        {evidence.relevance}
      </span>
      <div>
        {evidence.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
