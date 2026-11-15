// ---------------------------------------------------------------------
// TIMELINE PAGE - Exercise 4, Demo 2
// ---------------------------------------------------------------------
// Renders every event unconditionally by default, no filter dropdowns
// wired to onChange (that stays out of scope until Exercise 5).
//
// Demo 10: reads an optional ?person=<id> query param once, to decide
// the *initial* list instead of always "everything." useSearchParams()
// is itself a useState under the hood, but nothing here ever calls its
// setter, this component only ever reads the URL, never writes to it,
// so no interactive state is being introduced, just a one-time
// initial-render decision sourced from the URL instead of a hardcoded
// "show all events." The `visibleEvents.length === 0` check below used
// to be dead code (unreachable with the full 15-entry dataset); a
// person filter that matches nobody (a stale/mistyped link) now
// actually reaches it, confirmed live with ?person=not-a-real-person.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { TimelineEvent } from "../../types.js";
import TimelineEventItem from "./TimelineEventItem.js";

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [searchParams] = useSearchParams();
  const personFilter = searchParams.get("person");

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

  const visibleEvents = personFilter
    ? events.filter((event) => event.personIds.includes(personFilter))
    : events;

  return (
    <div>
      {personFilter && (
        <p>
          Filtered to events involving <strong>{personFilter}</strong>.{" "}
          <Link to="/timeline">Clear filter</Link>
        </p>
      )}
      {visibleEvents.length === 0 && <p>No timeline events match the current filters.</p>}
      {visibleEvents.map((event) => (
        <TimelineEventItem key={event.id} event={event} />
      ))}
    </div>
  );
}
