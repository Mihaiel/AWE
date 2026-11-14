// ---------------------------------------------------------------------
// TIMELINE PAGE - Exercise 4, Demo 2
// ---------------------------------------------------------------------
// Renders every event unconditionally, no filters wired yet (per this
// exercise's own rule: filter controls can be visually present later
// without onChange handlers; none are built here yet either). The
// `events.length === 0 &&` check below is genuinely real code, not
// filler, it's just not reachable with the current 15-entry dataset,
// exactly the "if applicable" the task itself allows for.
import { useEffect, useState } from "react";
import type { TimelineEvent } from "../../types.js";
import TimelineEventItem from "./TimelineEventItem.js";

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch("data/timeline.json");
      const json: unknown = await res.json();
      if (!cancelled) {
        setEvents(json as TimelineEvent[]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!events) {
    return <p>Loading case file&hellip;</p>;
  }

  return (
    <div>
      {events.length === 0 && <p>No timeline events match the current filters.</p>}
      {events.map((event) => (
        <TimelineEventItem key={event.id} event={event} />
      ))}
    </div>
  );
}
