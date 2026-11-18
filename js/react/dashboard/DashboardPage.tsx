// ---------------------------------------------------------------------
// DASHBOARD PAGE - the one real view migrated this exercise
// ---------------------------------------------------------------------
// Exercise 3, Demo 10. Fetches its own data directly via useEffect,
// a deliberate placeholder, not the final architecture. The vanilla app
// fetches once into one shared js/state.ts object every view reads
// from; duplicating that here per-component means re-fetching the same
// JSON every time this page mounts, and no sharing once more views
// migrate. See EXERCISE_3.md's first question for why this is fine for
// migrating exactly one view, and what should replace it once more do.
//
// Demo 9: applyEvidenceOverrides() re-applies any status/relevance
// edits saved from the Evidence detail view to this page's own fetched
// copy of evidence.json - without it, this page's "Reviewed" count
// would silently ignore those edits. See evidenceOverrides.ts and
// EXERCISE_5.md Demo 9.
//
// Exercise 6, Demo 9: the 5-way Promise.all() fetch effect below is
// now fetchDashboardData() (api.ts, the combined fetcher for this
// view's 5 resources) wrapped in withEvidenceOverrides()
// (evidenceOverrides.ts), passed to useFetch(). This component no
// longer calls fetch() itself, doesn't own loading state, and picked
// up a real error state (see the `error` check below) it never had
// before Demo 8/9's pattern existed.
import { useBookmarks } from "../BookmarksContext.js";
import { withEvidenceOverrides } from "../evidenceOverrides.js";
import { useFetch } from "../useFetch.js";
import { fetchDashboardData } from "../api.js";
import { formatDate, getStatusBadgeClass } from "../../utils.js";
import CaseSummaryCard from "./CaseSummaryCard.js";
import StatCard from "../components/StatCard.js";
import ReviewProgressBar from "../components/ReviewProgressBar.js";
import MiniListItem from "../components/MiniListItem.js";
import Badge from "../components/Badge.js";

// Module-level, not recreated per render - useFetch's own effect
// re-runs whenever the fetcher it's given changes identity, so this
// has to stay a stable reference, the same reason fetchTimeline/
// fetchPeople (api.ts) are plain exports instead of inline closures.
const loadDashboardData = withEvidenceOverrides(fetchDashboardData);

export default function DashboardPage() {
  const { bookmarks } = useBookmarks();
  const { data, error } = useFetch(loadDashboardData);

  if (error) {
    return <p className="warning-banner">Could not load the case file: {error}</p>;
  }

  if (!data) {
    return <p>Loading case file&hellip;</p>;
  }

  // Recalculated on every render, not cached anywhere - if this
  // component re-renders (or remounts) with different evidence data,
  // these are correct immediately, no stale-numbers risk. bookmarksCount
  // used to come from its own localStorage read here; Exercise 5 Demo 5
  // lifted the bookmarks array up to App.tsx (received as a prop), then
  // Demo 8 moved it again into BookmarksContext (received via
  // useBookmarks() above) - this is still just `bookmarks.length`
  // either way, still derived, not stored, just sourced one hop
  // differently.
  const reviewedCount = data.evidence.filter(
    (ev) => (ev.status || "").toLowerCase() === "reviewed",
  ).length;
  const progressPct =
    data.evidence.length === 0 ? 0 : Math.round((reviewedCount / data.evidence.length) * 100);
  const bookmarksCount = bookmarks.length;
  const recentEvidence = data.evidence.slice(-5).reverse();
  const recentTimeline = data.timeline.slice(-5).reverse();

  return (
    <div>
      <CaseSummaryCard
        title={data.caseData.title ?? "Case"}
        status={data.caseData.status ?? "unknown"}
        summary={data.caseData.summary ?? ""}
      />

      <div className="stat-grid">
        <StatCard value={data.evidence.length} label="Evidence items" />
        <StatCard value={data.people.length} label="People" />
        <StatCard value={data.locations.length} label="Locations" />
        <StatCard value={bookmarksCount} label="Bookmarked" />
        <StatCard value={reviewedCount} label="Reviewed" />
      </div>

      <ReviewProgressBar percent={progressPct} />

      <div className="dashboard-columns">
        <div className="dashboard-panel">
          <h3>Recent evidence</h3>
          {recentEvidence.length === 0 ? (
            <p>No evidence loaded yet.</p>
          ) : (
            recentEvidence.map((ev) => (
              <MiniListItem
                key={ev.id}
                primaryText={ev.id}
                secondaryText={ev.title}
                badge={<Badge variantClass={getStatusBadgeClass(ev.status)}>{ev.status}</Badge>}
              />
            ))
          )}
        </div>
        <div className="dashboard-panel">
          <h3>Recent timeline events</h3>
          {recentTimeline.length === 0 ? (
            <p>No timeline events loaded yet.</p>
          ) : (
            recentTimeline.map((evt) => (
              <MiniListItem
                key={evt.id}
                primaryText={formatDate(evt.time)}
                secondaryText={evt.title}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
