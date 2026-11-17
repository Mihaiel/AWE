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
//
// Exercise 6, Demo 7: added a "Refresh" button, a real, modest feature
// (re-sync with the backend without reloading the whole page) that
// also happens to be exactly what's needed to construct a request
// race on demand: click it, then click it again before the first
// response arrives, and - without a guard - whichever response
// happens to arrive LAST wins, not whichever request was started
// LAST. `load()` now takes an AbortController signal and aborts the
// *previous* in-flight request (`abortRef.current?.abort()`) before
// starting a new one, so a stale response can never land after a
// newer one already has; `AbortError` from that is caught and
// swallowed, not shown as a real error. This is a second, distinct
// abort call-site from the mount effect's own cleanup below, which
// aborts whatever's in flight if the component unmounts entirely -
// different trigger (a user click vs. navigating away), same
// mechanism. See EXERCISE_6.md Demo 7 for how the race was reproduced
// live before this guard existed, and confirmed gone after.
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { TimelineEvent } from "../../types.js";
import TimelineEventItem from "./TimelineEventItem.js";
import { API_BASE_URL } from "../apiConfig.js";

export default function TimelinePage() {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const personFilter = searchParams.get("person");
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${API_BASE_URL}/api/timeline`, { signal: controller.signal });
      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }
      const json: unknown = await res.json();
      setEvents(json as TimelineEvent[]);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // Superseded by a newer load() call - not a real failure,
        // nothing to show for this one.
        return;
      }
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  }, []);

  useEffect(() => {
    load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const refreshButton = (
    <button type="button" className="btn btn-secondary btn-small" onClick={() => load()}>
      Refresh
    </button>
  );

  if (error) {
    return (
      <div>
        <p className="warning-banner">Could not load the timeline: {error}</p>
        {refreshButton}
      </div>
    );
  }

  if (!events) {
    return <p>Loading case file&hellip;</p>;
  }

  if (events.length === 0) {
    return (
      <div>
        <p className="hint-text">No timeline events have been recorded for this case yet.</p>
        {refreshButton}
      </div>
    );
  }

  const visibleEvents = personFilter
    ? events.filter((event) => event.personIds.includes(personFilter))
    : events;

  return (
    <div>
      {refreshButton}
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
