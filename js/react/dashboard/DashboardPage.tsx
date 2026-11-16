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
import { useEffect, useState } from "react";
import type { Case, Evidence, Person, Location, TimelineEvent } from "../../types.js";
import { formatDate, getStatusBadgeClass } from "../../utils.js";
import { useBookmarks } from "../BookmarksContext.js";
import { applyEvidenceOverrides } from "../evidenceOverrides.js";
import CaseSummaryCard from "./CaseSummaryCard.js";
import StatCard from "../components/StatCard.js";
import ReviewProgressBar from "../components/ReviewProgressBar.js";
import MiniListItem from "../components/MiniListItem.js";
import Badge from "../components/Badge.js";

interface DashboardData {
  caseData: Partial<Case>;
  evidence: Evidence[];
  people: Person[];
  locations: Location[];
  timeline: TimelineEvent[];
}

export default function DashboardPage() {
  const { bookmarks } = useBookmarks();
  const [data, setData] = useState<DashboardData | null>(null);

  // Empty dependency array: re-fetches fresh every time this component
  // mounts, which happens every time the shell switches back to
  // "dashboard" (react-router's <Route> unmounts whichever page no
  // longer matches the URL, same as Demo 9's old PAGES map did).
  // Unlike the vanilla dashboard, there's no render-cache flag here at
  // all, see EXERCISE_3.md questions 2 and 3.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [caseRes, evidenceRes, peopleRes, locationsRes, timelineRes] = await Promise.all([
        fetch("data/case.json"),
        fetch("data/evidence.json"),
        fetch("data/people.json"),
        fetch("data/locations.json"),
        fetch("data/timeline.json"),
      ]);
      // unknown first, then asserted, same discipline as Exercise 2
      // Demo 6's dataLoader.ts, fetch().json() is `any` under the hood.
      const caseJson: unknown = await caseRes.json();
      const evidenceJson: unknown = await evidenceRes.json();
      const peopleJson: unknown = await peopleRes.json();
      const locationsJson: unknown = await locationsRes.json();
      const timelineJson: unknown = await timelineRes.json();

      if (!cancelled) {
        setData({
          caseData: caseJson as Partial<Case>,
          evidence: applyEvidenceOverrides(evidenceJson as Evidence[]),
          people: peopleJson as Person[],
          locations: locationsJson as Location[],
          timeline: timelineJson as TimelineEvent[],
        });
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

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
