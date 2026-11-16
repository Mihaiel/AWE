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
// not this demo's. Search is wired (onChange) but not yet a controlled
// input (no `value=` on the box below) - Demo 2's job to close that
// loop; for now this only filters by title/summary/tag, mirroring the
// vanilla search handler's own scope, not the other 5 filter selects
// (those stay static until Demo 4 builds the real combined derived
// list).
import { useEffect, useState } from "react";
import type { Evidence, Person, Location } from "../../types.js";
import { STORAGE_KEY_BOOKMARKS } from "../../storage.js";
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

  const term = searchTerm.toLowerCase().trim();
  const visibleEvidence = term
    ? data.evidence.filter((ev) =>
        (ev.title + " " + ev.summary + " " + ev.tags.join(" ")).toLowerCase().includes(term),
      )
    : data.evidence;

  function handleToggleBookmark(evidenceId: string) {
    const next = bookmarks.includes(evidenceId)
      ? bookmarks.filter((id) => id !== evidenceId)
      : [...bookmarks, evidenceId];
    setBookmarks(next);
    writeBookmarks(next);
  }

  const selectedEvidence = data.evidence.find((ev) => ev.id === selectedEvidenceId) ?? null;

  return (
    <div>
      <h2>Evidence Catalogue</h2>
      <EvidenceFilterToolbar
        evidenceTypes={evidenceTypes}
        people={data.people}
        locations={data.locations}
        onSearchChange={setSearchTerm}
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
