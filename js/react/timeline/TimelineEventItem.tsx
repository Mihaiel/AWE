// ---------------------------------------------------------------------
// TIMELINE EVENT ITEM - presentational, one TimelineEvent prop
// ---------------------------------------------------------------------
// Same markup/classes as the vanilla renderTimeline() in js/views/timeline.ts
// (minus the location/evidence links, those need cross-view navigation
// into Evidence, out of scope this exercise, same reasoning as Demo 1's
// PersonCard dropping the "related evidence - view" link).
import type { TimelineEvent } from "../../types.js";
import { formatDate } from "../../utils.js";
import CertaintyBadge from "./CertaintyBadge.js";

interface TimelineEventItemProps {
  event: TimelineEvent;
}

export default function TimelineEventItem({ event }: TimelineEventItemProps) {
  return (
    <div className={"timeline-event certainty-" + event.certainty}>
      <div className="timeline-time">
        {formatDate(event.time)} &middot; <CertaintyBadge certainty={event.certainty} />
      </div>
      <h3>{event.title}</h3>
      <p>{event.description}</p>
    </div>
  );
}
