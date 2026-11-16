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
// The other 5 selects + sort + "Clear filters" are deliberately still
// static: real options, no onChange, same "visually complete, not
// wired yet" allowance Exercise 4's Timeline toolbar used. Demo 4 wires
// these into the actual filtered/sorted list; Demo 7 moves all of this
// into one useReducer once there are 7+ related values to manage.
import type { Person, Location } from "../../types.js";

interface EvidenceFilterToolbarProps {
  searchTerm: string;
  evidenceTypes: string[];
  people: Person[];
  locations: Location[];
  onSearchChange: (term: string) => void;
}

export default function EvidenceFilterToolbar({
  searchTerm,
  evidenceTypes,
  people,
  locations,
  onSearchChange,
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
        <select id="filterType">
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
        <select id="filterPerson">
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
        <select id="filterLocation">
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
        <select id="filterStatus">
          <option value="">All statuses</option>
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>

        <label htmlFor="filterRelevance" className="visually-hidden">
          Filter by relevance
        </label>
        <select id="filterRelevance">
          <option value="">All relevance</option>
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>

        <label htmlFor="sortEvidence" className="visually-hidden">
          Sort evidence
        </label>
        <select id="sortEvidence">
          <option value="date-desc">Newest first</option>
          <option value="date-asc">Oldest first</option>
          <option value="title-asc">Title (A–Z)</option>
          <option value="title-desc">Title (Z–A)</option>
        </select>

        <button type="button" className="btn btn-secondary">
          Clear filters
        </button>
      </div>
    </div>
  );
}
