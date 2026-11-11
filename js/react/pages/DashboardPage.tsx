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
import { useEffect, useState } from "react";
import type { Case, Evidence, Person, Location, TimelineEvent } from "../../types.js";
import { formatDate, getStatusBadgeClass } from "../../utils.js";
import { STORAGE_KEY_BOOKMARKS } from "../../storage.js";
import CaseSummaryCard from "../components/CaseSummaryCard.js";
import StatCard from "../components/StatCard.js";
import ReviewProgressBar from "../components/ReviewProgressBar.js";
import MiniListItem from "../components/MiniListItem.js";

interface DashboardData {
  caseData: Partial<Case>;
  evidence: Evidence[];
  people: Person[];
  locations: Location[];
  timeline: TimelineEvent[];
}

function readBookmarksCount(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  // Empty dependency array: re-fetches fresh every time this component
  // mounts, which happens every time the shell switches back to
  // "dashboard" (Demo 9's PAGES map fully unmounts the previous page).
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
          evidence: evidenceJson as Evidence[],
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
  // these are correct immediately, no stale-numbers risk.
  const reviewedCount = data.evidence.filter(
    (ev) => (ev.status || "").toLowerCase() === "reviewed",
  ).length;
  const progressPct =
    data.evidence.length === 0 ? 0 : Math.round((reviewedCount / data.evidence.length) * 100);
  const bookmarksCount = readBookmarksCount();
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
                badge={
                  <span className={"badge " + getStatusBadgeClass(ev.status)}>{ev.status}</span>
                }
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
