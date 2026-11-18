// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE PAGE - Exercise 5 Demo 1
// ---------------------------------------------------------------------
// Fetches its own data the same way every other top-level page does
// (Exercise 3/4's established, known placeholder - see
// EXERCISE_3.md's first question for why this is fine per-view and
// what should replace it once a shared data layer exists).
//
// Demo 5: bookmarks and the toggle handler no longer live here - they
// moved up to App.tsx, the lowest common ancestor of this page,
// DashboardPage, and WorkspacePage, and arrive as props instead. See
// App.tsx's own comment and EXERCISE_5.md Demo 5.
//
// Demo 8: and now they don't arrive as props at all - useBookmarks()
// below reads them straight from BookmarksContext instead. See
// BookmarksContext.tsx and EXERCISE_5.md Demo 8.
//
// Demo 2: searchTerm is now a real controlled input, see
// EvidenceFilterToolbar.tsx's own comment. Still only filters by
// title/summary/tag, mirroring the vanilla search handler's own scope,
// not the other 5 filter selects (those stay static until Demo 4
// builds the real combined derived list).
//
// Demo 3: handleToggleBookmark (now in App.tsx) always produces a
// brand new array (via .filter()/spread), never mutates `bookmarks` in
// place - see App.tsx for that handler and its commented-out buggy
// counterpart.
//
// Demo 4: the 5 remaining filter selects + sort, left
// static since Demo 1, are now wired. `visibleEvidence` below is still
// the one derived value computed from data.evidence + all the filter
// state + sortOrder, every render, exactly like getFilteredEvidence()
// did in the vanilla version (js/views/evidence.ts), just without ever
// storing the result itself. There's deliberately no separate
// `filteredEvidence` state here - see EXERCISE_5.md Demo 4.
//
// Demo 6: the detail view's status/relevance selects, static since
// Demo 1, are now wired too. `data.evidence` lives in this component,
// not EvidenceDetail, so EvidenceDetail can't update it directly -
// handleEvidenceStatusChange/handleEvidenceRelevanceChange below are
// passed down as onStatusChange/onRelevanceChange, the same
// "callback down, not a reach-up mutation" shape bookmarks already use
// via App.tsx. Both update `data` immutably (a new evidence array via
// .map(), never evidence.status = ... in place), so the card's badge
// and the derived visibleEvidence list both pick up the change on the
// very next render, same as every other derived value in this file.
//
// Demo 7: the 6 separate useState calls for search/filters/sort Demo 4
// introduced are now one useReducer. This domain is exactly the case
// Demo 2's HypothesisDraft comment said would need one: several related
// values that change individually (one SET_FILTER per select) but also
// need a single named bulk operation (CLEAR_FILTERS resets all 6 at
// once, consistently - no risk of resetting 5 of 6 and forgetting one).
// filtersReducer/INITIAL_FILTERS/EvidenceFiltersAction live below,
// outside the component since they don't depend on any props or state.
//
// Demo 9: found (by testing it directly, not from a visible crash) that
// status/relevance edits from the detail view never persisted anywhere
// - they lived only in this component's own `data` state, so Dashboard
// never saw them and navigating away from Evidence and back silently
// lost them. applyEvidenceOverrides() now re-applies any saved
// overrides right after fetching, and the two handlers below write
// through writeEvidenceOverride() as well as updating `data`. See
// evidenceOverrides.ts and EXERCISE_5.md Demo 9.
//
// Exercise 6, Demo 9: the Promise.all() fetch effect below is now
// fetchEvidenceCatalogueData() (api.ts) wrapped in
// withEvidenceOverrides() (evidenceOverrides.ts), passed to
// useFetch() - same pattern as DashboardPage.tsx/WorkspacePage.tsx.
// The one difference: the status/relevance handlers below need to
// apply a local update to the already-fetched evidence array right
// after writing an override, without waiting on a refetch - that's
// what useFetch's own `setData` escape hatch is for (see that file's
// own comment for why it exists).
import { useReducer, useState } from "react";
import { evidenceMentionsPerson } from "../../utils.js";
import { useBookmarks } from "../BookmarksContext.js";
import { writeEvidenceOverride, withEvidenceOverrides } from "../evidenceOverrides.js";
import { useFetch } from "../useFetch.js";
import { fetchEvidenceCatalogueData } from "../api.js";
import EvidenceFilterToolbar from "./EvidenceFilterToolbar.js";
import EvidenceCard from "./EvidenceCard.js";
import EvidenceDetail from "./EvidenceDetail.js";

// Module-level, stable reference - see DashboardPage.tsx's own comment
// for why this can't be recreated inside the component.
const loadEvidenceCatalogue = withEvidenceOverrides(fetchEvidenceCatalogueData);

interface EvidenceFiltersState {
  searchTerm: string;
  filterType: string;
  filterPersonId: string;
  filterLocationId: string;
  filterStatus: string;
  filterRelevance: string;
  sortOrder: string;
}

type EvidenceFilterField = Exclude<keyof EvidenceFiltersState, "sortOrder">;

type EvidenceFiltersAction =
  | { type: "SET_FILTER"; field: EvidenceFilterField; value: string }
  | { type: "SET_SORT"; sortOrder: string }
  | { type: "CLEAR_FILTERS" };

const INITIAL_FILTERS: EvidenceFiltersState = {
  searchTerm: "",
  filterType: "",
  filterPersonId: "",
  filterLocationId: "",
  filterStatus: "",
  filterRelevance: "",
  sortOrder: "date-desc",
};

function filtersReducer(
  state: EvidenceFiltersState,
  action: EvidenceFiltersAction,
): EvidenceFiltersState {
  switch (action.type) {
    case "SET_FILTER":
      return { ...state, [action.field]: action.value };
    case "SET_SORT":
      return { ...state, sortOrder: action.sortOrder };
    case "CLEAR_FILTERS":
      return INITIAL_FILTERS;
  }
}

export default function EvidencePage() {
  const { bookmarks, toggleBookmark } = useBookmarks();
  const { data, error, setData } = useFetch(loadEvidenceCatalogue);
  const [filters, dispatch] = useReducer(filtersReducer, INITIAL_FILTERS);
  const {
    searchTerm,
    filterType,
    filterPersonId,
    filterLocationId,
    filterStatus,
    filterRelevance,
    sortOrder,
  } = filters;
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(null);

  if (error) {
    return <p className="warning-banner">Could not load the evidence catalogue: {error}</p>;
  }

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

  function handleEvidenceStatusChange(evidenceId: string, status: string) {
    writeEvidenceOverride(evidenceId, { status });
    setData((prev) =>
      prev
        ? {
            ...prev,
            evidence: prev.evidence.map((ev) => (ev.id === evidenceId ? { ...ev, status } : ev)),
          }
        : prev,
    );
  }

  function handleEvidenceRelevanceChange(evidenceId: string, relevance: string) {
    writeEvidenceOverride(evidenceId, { relevance });
    setData((prev) =>
      prev
        ? {
            ...prev,
            evidence: prev.evidence.map((ev) => (ev.id === evidenceId ? { ...ev, relevance } : ev)),
          }
        : prev,
    );
  }

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
        onSearchChange={(value) => dispatch({ type: "SET_FILTER", field: "searchTerm", value })}
        onFilterTypeChange={(value) => dispatch({ type: "SET_FILTER", field: "filterType", value })}
        onFilterPersonChange={(value) =>
          dispatch({ type: "SET_FILTER", field: "filterPersonId", value })
        }
        onFilterLocationChange={(value) =>
          dispatch({ type: "SET_FILTER", field: "filterLocationId", value })
        }
        onFilterStatusChange={(value) =>
          dispatch({ type: "SET_FILTER", field: "filterStatus", value })
        }
        onFilterRelevanceChange={(value) =>
          dispatch({ type: "SET_FILTER", field: "filterRelevance", value })
        }
        onSortChange={(sortOrder) => dispatch({ type: "SET_SORT", sortOrder })}
        onClearFilters={() => dispatch({ type: "CLEAR_FILTERS" })}
      />
      <div className="evidence-grid">
        {visibleEvidence.length === 0 && <p>No evidence matches the current filters.</p>}
        {visibleEvidence.map((ev) => (
          <EvidenceCard
            key={ev.id}
            evidence={ev}
            isBookmarked={bookmarks.includes(ev.id)}
            onToggleBookmark={toggleBookmark}
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
          onStatusChange={handleEvidenceStatusChange}
          onRelevanceChange={handleEvidenceRelevanceChange}
        />
      )}
    </div>
  );
}
