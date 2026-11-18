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
// Exercise 6, Demos 6-7 built the loading/error/empty states and the
// AbortController-based refresh/cancellation directly in this
// component. Demo 8 pulled all of that out into useFetch() - see that
// file's own comment for why it's a legitimate hook, not just a
// helper function. What's left here is purely this view's own
// concerns: the "genuinely zero events" vs. "filter matched nobody"
// distinction (still two different messages, same reasoning as
// before), and the ?person= filtering itself - neither belongs in a
// generic fetch hook, they're specific to what a timeline event is.
//
// Demo 9: useFetch() took a raw URL string before; now it takes
// fetchTimeline itself, from api.ts - this component no longer knows
// "/api/timeline" or API_BASE_URL exist at all, only that something
// can hand it a TimelineEvent[].
import { Link, useSearchParams } from "react-router-dom";
import TimelineEventItem from "./TimelineEventItem.js";
import { useFetch } from "../useFetch.js";
import { fetchTimeline } from "../api.js";

export default function TimelinePage() {
  const { data: events, error, refetch } = useFetch(fetchTimeline);
  const [searchParams] = useSearchParams();
  const personFilter = searchParams.get("person");

  const refreshButton = (
    <button type="button" className="btn btn-secondary btn-small" onClick={refetch}>
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
