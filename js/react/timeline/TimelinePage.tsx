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
//
// Exercise 6, Demo 5: fetch() below now hits the dev-only backend
// instead of the static data/timeline.json file. See
// DashboardPage.tsx's own comment and EXERCISE_6.md Demo 5.
//
// Exercise 6, Demo 6: picked this view (one resource, one fetch, no
// Promise.all juggling) to build out all three states explicitly.
// `error` is tracked separately from `events` - "loading" is
// error === null && events === null, "error" is error !== null
// (checked first, regardless of what `events` is), "loaded but the
// case file genuinely has zero timeline events" is
// error === null && events !== null && events.length === 0. That last
// one is NOT the same thing as the existing
// "No timeline events match the current filters" message further down
// - this new check is unconditional, about the raw fetched data before
// any `?person=` filtering; the existing one is about a filter that
// matched nobody. Different causes, so deliberately different
// messages instead of collapsing both into one "nothing to show" line.
// See EXERCISE_6.md Demo 6 for how each was verified live (the error
// path via the backend's own ?error=1, the empty path by temporarily
// replacing public/data/timeline.json with [] and restoring it after).
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { TimelineEvent } from "../../types.js";
import TimelineEventItem from "./TimelineEventItem.js";
import { API_BASE_URL } from "../apiConfig.js";

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const personFilter = searchParams.get("person");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`${API_BASE_URL}/api/timeline`);
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}`);
        }
        const json: unknown = await res.json();
        if (!cancelled) {
          setEvents(json as TimelineEvent[]);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p className="warning-banner">Could not load the timeline: {error}</p>;
  }

  if (!events) {
    return <p>Loading case file&hellip;</p>;
  }

  if (events.length === 0) {
    return <p className="hint-text">No timeline events have been recorded for this case yet.</p>;
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
