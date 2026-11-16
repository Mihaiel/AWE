// ---------------------------------------------------------------------
// EVIDENCE FILTER TOOLBAR - presentational, Exercise 5 Demo 1
// ---------------------------------------------------------------------
// Same fields/options as the vanilla toolbar in index.html, now built
// once from real data instead of populateEvidenceDropdowns() rebuilding
// <option> strings by hand every time the view loads.
//
// Demo 1 wired the search box's onChange but left it uncontrolled (no
// `value=`). Demo 2 closes that loop: `value={searchTerm}` now comes
// from EvidencePage's own useState, so the box always shows exactly
// what React thinks the search term is, not whatever the browser's own
// uncontrolled DOM input happens to display. See EXERCISE_5.md Demo 2
// for what breaks if the `onChange` below is removed but `value` stays.
//
// Demo 4: the other 5 selects + sort + "Clear filters" are now wired
// too, each a controlled value/onChange pair same as the search box
// above. Still 7 separate props/callbacks rather than one object,
// because this component itself holds no state - EvidencePage owns
// all of it and derives the visible list from it every render (see
// EXERCISE_5.md Demo 4). Demo 7 is what moves EvidencePage's own 6
// separate useState calls for this into one useReducer, not this file.
import type { Person, Location } from "../../types.js";

interface EvidenceFilterToolbarProps {
  searchTerm: string;
  evidenceTypes: string[];
  people: Person[];
  locations: Location[];
  filterType: string;
  filterPersonId: string;
  filterLocationId: string;
  filterStatus: string;
  filterRelevance: string;
  sortOrder: string;
  onSearchChange: (term: string) => void;
  onFilterTypeChange: (type: string) => void;
  onFilterPersonChange: (personId: string) => void;
  onFilterLocationChange: (locationId: string) => void;
  onFilterStatusChange: (status: string) => void;
  onFilterRelevanceChange: (relevance: string) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

export default function EvidenceFilterToolbar({
  searchTerm,
  evidenceTypes,
  people,
  locations,
  filterType,
  filterPersonId,
  filterLocationId,
  filterStatus,
  filterRelevance,
  sortOrder,
  onSearchChange,
  onFilterTypeChange,
  onFilterPersonChange,
  onFilterLocationChange,
  onFilterStatusChange,
  onFilterRelevanceChange,
  onSortChange,
  onClearFilters,
}: EvidenceFilterToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-row">
        <label htmlFor="evidenceSearch" className="visually-hidden">
          Search evidence
        </label>
        <input
          type="text"
          id="evidenceSearch"
          placeholder="Search evidence by title, summary, or tag…"
          autoComplete="off"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        <label htmlFor="filterType" className="visually-hidden">
          Filter by type
        </label>
        <select
          id="filterType"
          value={filterType}
          onChange={(event) => onFilterTypeChange(event.target.value)}
        >
          <option value="">All types</option>
          {evidenceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <label htmlFor="filterPerson" className="visually-hidden">
          Filter by person
        </label>
        <select
          id="filterPerson"
          value={filterPersonId}
          onChange={(event) => onFilterPersonChange(event.target.value)}
        >
          <option value="">All people</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
        </select>

        <label htmlFor="filterLocation" className="visually-hidden">
          Filter by location
        </label>
        <select
          id="filterLocation"
          value={filterLocationId}
          onChange={(event) => onFilterLocationChange(event.target.value)}
        >
          <option value="">All locations</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.id} - {location.name}
            </option>
          ))}
        </select>
      </div>
      <div className="toolbar-row">
        <label htmlFor="filterStatus" className="visually-hidden">
          Filter by status
        </label>
        <select
          id="filterStatus"
          value={filterStatus}
          onChange={(event) => onFilterStatusChange(event.target.value)}
        >
          <option value="">All statuses</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>

        <label htmlFor="filterRelevance" className="visually-hidden">
          Filter by relevance
        </label>
        <select
          id="filterRelevance"
          value={filterRelevance}
          onChange={(event) => onFilterRelevanceChange(event.target.value)}
        >
          <option value="">All relevance</option>
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>

        <label htmlFor="sortEvidence" className="visually-hidden">
          Sort evidence
        </label>
        <select
          id="sortEvidence"
          value={sortOrder}
          onChange={(event) => onSortChange(event.target.value)}
        >
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">Title (A–Z)</option>
          <option value="title-desc">Title (Z–A)</option>
        </select>

        <button type="button" className="btn btn-secondary" onClick={onClearFilters}>
          Clear filters
        </button>
      </div>
    </div>
  );
}
