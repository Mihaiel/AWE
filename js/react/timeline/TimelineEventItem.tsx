// ---------------------------------------------------------------------
// TIMELINE EVENT ITEM - presentational, one TimelineEvent prop
// ---------------------------------------------------------------------
// Same markup/classes as the vanilla renderTimeline() in js/views/timeline.ts
// (minus the location/evidence links, those need cross-view navigation
// into Evidence, out of scope this exercise, same reasoning as Demo 1's
// PersonCard dropping the "related evidence - view" link).
//
// Exercise 6, Demo 3: added the "Quick view" button/modal below - a
// real gap, not a Demo 3 invention: `personIds`/`locationIds`/
// `evidenceIds` have existed on TimelineEvent since Exercise 2, but
// nothing ever rendered them anywhere in this React view (the vanilla
// app's own equivalent, openEvidenceModal() in js/views/timeline.ts,
// never got migrated either). This is the demo's genuine, justified
// "needs cleanup" effect: while the modal is open, pressing Escape
// should close it, which means a window keydown listener - and that
// listener has to be removed again, or it outlives the reason it was
// added. Reuses the existing .modal-backdrop/.modal-box/.modal-close-btn
// CSS classes the vanilla modal already used, no new styles needed.
import { useEffect, useState } from "react";
import type { TimelineEvent } from "../../types.js";
import { formatDate } from "../../utils.js";
import CertaintyBadge from "./CertaintyBadge.js";

interface TimelineEventItemProps {
  event: TimelineEvent;
}

export default function TimelineEventItem({ event }: TimelineEventItemProps) {
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  useEffect(() => {
    if (!quickViewOpen) return;

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setQuickViewOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [quickViewOpen]);

  return (
    <div className={"timeline-event certainty-" + event.certainty}>
      <div className="timeline-time">
        {formatDate(event.time)} &middot; <CertaintyBadge certainty={event.certainty} />
      </div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
      <button
        type="button"
        className="btn btn-secondary btn-small"
        onClick={() => setQuickViewOpen(true)}
      >
        Quick view
      </button>
      {quickViewOpen && (
        <div className="modal-backdrop" onClick={() => setQuickViewOpen(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              aria-label="Close"
              onClick={() => setQuickViewOpen(false)}
            >
              &times;
            </button>
            <h3>{event.title}</h3>
            <p className="evidence-meta">{formatDate(event.time)}</p>
            <p>{event.description}</p>
            <p>
              <strong>People involved:</strong>{" "}
              {event.personIds.length > 0 ? event.personIds.join(", ") : "none recorded"}
            </p>
            <p>
              <strong>Locations:</strong>{" "}
              {event.locationIds.length > 0 ? event.locationIds.join(", ") : "none recorded"}
            </p>
            <p>
              <strong>Related evidence:</strong>{" "}
              {event.evidenceIds.length > 0 ? event.evidenceIds.join(", ") : "none recorded"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
