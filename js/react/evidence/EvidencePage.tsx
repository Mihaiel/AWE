// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE PAGE - Exercise 5 Demo 1
// ---------------------------------------------------------------------
// Fetches its own data the same way every other top-level page does
// (Exercise 3/4's established, known placeholder - see
// EXERCISE_3.md's first question for why this is fine per-view and
// what should replace it once a shared data layer exists).
//
// Bookmarks live as this component's own useState for now, persisted to
// localStorage (same STORAGE_KEY_BOOKMARKS key the vanilla app used) so
// WorkspacePage can read the current set independently on its own
// mount. That's a deliberate, temporary duplication: the real single
// source of truth should be one piece of state both pages read from,
// that's exactly Demo 5's "lift state to the nearest common owner" job,
// not this demo's.
//
// Demo 2: searchTerm is now a real controlled input, see
// EvidenceFilterToolbar.tsx's own comment. Still only filters by
// title/summary/tag, mirroring the vanilla search handler's own scope,
// not the other 5 filter selects (those stay static until Demo 4
// builds the real combined derived list).
//
// Demo 3: handleToggleBookmark below always produces a brand new array
// (via .filter()/spread), never mutates `bookmarks` in place. See the
// commented-out handleToggleBookmarkBuggy right after it for the
// "first instinct" version this deliberately isn't, kept in the repo
// to swap in live rather than deleted, same convention as Exercise 4
// Demo 4's KeyDemoThrowaway.
//
// Demo 4: the 5 remaining filter selects + sort, left
// static since Demo 1, are now wired. Each one is its own useState -
// genuine stored state, since "what the user picked" can't be computed
// from anything else. `visibleEvidence` below is still the one derived
// value computed from data.evidence + searchTerm + all 5 filters +
// sortOrder, every render, exactly like getFilteredEvidence() did in
// the vanilla version (js/views/evidence.ts), just without ever storing
// the result itself. There's deliberately no separate
// `filteredEvidence` state here - see EXERCISE_5.md Demo 4.
import { useEffect, useState } from "react";
import type { Evidence, Person, Location } from "../../types.js";
import { STORAGE_KEY_BOOKMARKS } from "../../storage.js";
import { evidenceMentionsPerson } from "../../utils.js";
import EvidenceFilterToolbar from "./EvidenceFilterToolbar.js";
import EvidenceCard from "./EvidenceCard.js";
import EvidenceDetail from "./EvidenceDetail.js";

interface EvidenceCatalogueData {
  evidence: Evidence[];
  people: Person[];
  locations: Location[];
}

function readBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeBookmarks(bookmarks: string[]): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
}

export default function EvidencePage() {
  const [data, setData] = useState<EvidenceCatalogueData | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>(readBookmarks);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterPersonId, setFilterPersonId] = useState("");
  const [filterLocationId, setFilterLocationId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRelevance, setFilterRelevance] = useState("");
  const [sortOrder, setSortOrder] = useState("date-desc");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [evidenceRes, peopleRes, locationsRes] = await Promise.all([
        fetch("data/evidence.json"),
        fetch("data/people.json"),
        fetch("data/locations.json"),
      ]);
      const evidenceJson: unknown = await evidenceRes.json();
      const peopleJson: unknown = await peopleRes.json();
      const locationsJson: unknown = await locationsRes.json();

      if (!cancelled) {
        setData({
          evidence: evidenceJson as Evidence[],
          people: peopleJson as Person[],
          locations: locationsJson as Location[],
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

  const evidenceTypes = [...new Set(data.evidence.map((ev) => ev.type.toLowerCase()))];

  // One derived value, recomputed from data.evidence + every filter/sort
  // piece of state above, every render - never its own useState. Mirrors
  // getFilteredEvidence()/handleSortChange() in js/views/evidence.ts,
  // just as one expression instead of a loop plus a separate in-place
  // .sort() call. See EXERCISE_5.md Demo 4 for why this structurally
  // rules out the vanilla app's two related bugs (stale bookmark count,
  // filteredEvidence aliasing allEvidence).
  const term = searchTerm.toLowerCase().trim();
  const filterPerson = filterPersonId ? data.people.find((p) => p.id === filterPersonId) : null;
  const visibleEvidence = data.evidence
    .filter((ev) => {
      if (
        term &&
        !(ev.title + " " + ev.summary + " " + ev.tags.join(" ")).toLowerCase().includes(term)
      ) {
        return false;
      }
      if (filterType && ev.type.toLowerCase() !== filterType) return false;
      if (filterPersonId && (!filterPerson || !evidenceMentionsPerson(ev, filterPerson)))
        return false;
      if (filterLocationId && !ev.locationIds.includes(filterLocationId)) return false;
      if (filterStatus && (ev.status || "").toLowerCase() !== filterStatus) return false;
      if (filterRelevance && (ev.relevance || "").toLowerCase() !== filterRelevance) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortOrder === "title-asc") return a.title.localeCompare(b.title);
      if (sortOrder === "title-desc") return b.title.localeCompare(a.title);
      const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      return sortOrder === "date-asc" ? diff : -diff;
    });

  function handleClearFilters() {
    setSearchTerm("");
    setFilterType("");
    setFilterPersonId("");
    setFilterLocationId("");
    setFilterStatus("");
    setFilterRelevance("");
    setSortOrder("date-desc");
  }

  function handleToggleBookmark(evidenceId: string) {
    const next = bookmarks.includes(evidenceId)
      ? bookmarks.filter((id) => id !== evidenceId)
      : [...bookmarks, evidenceId];
    setBookmarks(next);
    writeBookmarks(next);
  }

  // ---------------------------------------------------------------------
  // Exercise 5, Demo 3 live demo (uncomment this function, then swap the
  // `onToggleBookmark={handleToggleBookmark}` prop below to
  // `onToggleBookmark={handleToggleBookmarkBuggy}` to show it in class):
  // click a star and nothing happens, not even a second later, because
  // .push()/.splice() mutate `bookmarks` in place and setBookmarks is
  // then called with that EXACT SAME array reference. React's setState
  // bails out via Object.is(prevState, nextState) and skips the
  // re-render entirely when they're reference-equal, so the star never
  // flips, the data did change in memory (log `bookmarks` in the
  // console right after clicking - it's correct!), React just never
  // found out. Swap back to handleToggleBookmark afterward.
  // function handleToggleBookmarkBuggy(evidenceId: string) {
  //   if (bookmarks.includes(evidenceId)) {
  //     bookmarks.splice(bookmarks.indexOf(evidenceId), 1);
  //   } else {
  //     bookmarks.push(evidenceId);
  //   }
  //   setBookmarks(bookmarks);
  //   writeBookmarks(bookmarks);
  // }

  const selectedEvidence = data.evidence.find((ev) => ev.id === selectedEvidenceId) ?? null;

  return (
    <div>
      <h2>Evidence Catalogue</h2>
      <EvidenceFilterToolbar
        searchTerm={searchTerm}
        evidenceTypes={evidenceTypes}
        people={data.people}
        locations={data.locations}
        filterType={filterType}
        filterPersonId={filterPersonId}
        filterLocationId={filterLocationId}
        filterStatus={filterStatus}
        filterRelevance={filterRelevance}
        sortOrder={sortOrder}
        onSearchChange={setSearchTerm}
        onFilterTypeChange={setFilterType}
        onFilterPersonChange={setFilterPersonId}
        onFilterLocationChange={setFilterLocationId}
        onFilterStatusChange={setFilterStatus}
        onFilterRelevanceChange={setFilterRelevance}
        onSortChange={setSortOrder}
        onClearFilters={handleClearFilters}
      />
      <div className="evidence-grid">
        {visibleEvidence.length === 0 && <p>No evidence matches the current filters.</p>}
        {visibleEvidence.map((ev) => (
          <EvidenceCard
            key={ev.id}
            evidence={ev}
            isBookmarked={bookmarks.includes(ev.id)}
            onToggleBookmark={handleToggleBookmark}
            onOpen={setSelectedEvidenceId}
          />
        ))}
      </div>
      {selectedEvidence && (
        <EvidenceDetail
          key={selectedEvidence.id}
          evidence={selectedEvidence}
          people={data.people}
          locations={data.locations}
          onClose={() => setSelectedEvidenceId(null)}
        />
      )}
    </div>
  );
}
