// ---------------------------------------------------------------------
// WORKSPACE PAGE - Exercise 5 Demo 1
// ---------------------------------------------------------------------
// Static structure for all three pieces the vanilla workspace.ts built:
// the bookmarked-evidence list, the notes list, and the hypothesis
// form. None of this demo's 3 chosen event-handler migrations (bookmark
// click, search input, save-note click) live here, they're all on the
// Evidence side - this page only needs to read the results of the
// bookmark/note handlers that live in EvidencePage/EvidenceDetail, via
// the same localStorage keys.
//
// Reading bookmarks straight from localStorage here (not from
// EvidencePage's own useState) is a deliberate, temporary duplication:
// there's no common owner for bookmark state yet, so this page has no
// other way to know what's bookmarked. That's exactly the problem
// Demo 5 ("lift state to the nearest common owner") exists to fix.
//
// The hypothesis form below is intentionally NOT wired to anything yet
// - real options, real markup, zero state. Demo 2's own task list names
// making this form fully controlled and wiring "Save hypothesis draft"
// explicitly, so building that here would just be redoing Demo 2's job
// early.
import { useEffect, useState } from "react";
import type { Evidence, Person } from "../../types.js";
import { STORAGE_KEY_BOOKMARKS, STORAGE_KEY_NOTES } from "../../storage.js";

interface WorkspaceData {
  evidence: Evidence[];
  people: Person[];
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

function readNotes(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export default function WorkspacePage() {
  const [data, setData] = useState<WorkspaceData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [evidenceRes, peopleRes] = await Promise.all([
        fetch("data/evidence.json"),
        fetch("data/people.json"),
      ]);
      const evidenceJson: unknown = await evidenceRes.json();
      const peopleJson: unknown = await peopleRes.json();

      if (!cancelled) {
        setData({ evidence: evidenceJson as Evidence[], people: peopleJson as Person[] });
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

  const bookmarks = readBookmarks();
  const bookmarkedEvidence = data.evidence.filter((ev) => bookmarks.includes(ev.id));

  const notes = readNotes();
  // Key by evidence.id, not array position - the exact fix for Exercise
  // 4 Demo 4's "index used as identifier" bug this app already diagnosed
  // once, in the vanilla version of this exact list.
  const noteEntries = data.evidence
    .filter((ev) => notes[ev.id])
    .map((ev) => ({ evidenceId: ev.id, title: ev.title, text: notes[ev.id]! }));

  return (
    <div>
      <h2>Investigator Workspace</h2>

      <div className="workspace-grid">
        <div className="workspace-col">
          <h3>Bookmarked Evidence</h3>
          <div className="bookmarks-list">
            {bookmarkedEvidence.length === 0 ? (
              <p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>
            ) : (
              bookmarkedEvidence.map((ev) => (
                <div key={ev.id} className="mini-list-item">
                  <strong>{ev.id}</strong> &mdash; {ev.title}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="workspace-col">
          <h3>Personal Notes</h3>
          <p className="hint-text">
            Notes are attached to whichever evidence item is currently open in the Evidence view.
          </p>
          <div className="notes-list">
            {noteEntries.length === 0 ? (
              <p>No notes yet. Add one from an evidence item&apos;s detail view.</p>
            ) : (
              noteEntries.map((entry) => (
                <div key={entry.evidenceId} className="mini-list-item">
                  <strong>{entry.evidenceId}</strong> &mdash; {entry.title}
                  <div>{entry.text}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="hypothesis-card">
        <h3>Hypothesis Draft</h3>
        <form id="hypothesisForm">
          <div className="form-row">
            <label htmlFor="hypSuspect">Suspected responsible person</label>
            <select id="hypSuspect">
              <option value="">Select a person&hellip;</option>
              {data.people.map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="hypNature">Accidental or deliberate incident</label>
            <select id="hypNature">
              <option value="">Select&hellip;</option>
              <option value="accidental">Accidental</option>
              <option value="deliberate">Deliberate</option>
              <option value="unclear">Unclear</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="hypEvidence">Selected supporting evidence</label>
            <select id="hypEvidence" multiple size={6}>
              {data.evidence.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.id} - {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="hypConfidence">Confidence (0&ndash;100)</label>
            <input type="range" id="hypConfidence" min={0} max={100} defaultValue={50} />
            <output id="hypConfidenceValue">50</output>
          </div>

          <div className="form-row">
            <label htmlFor="hypExplanation">Written explanation</label>
            <textarea id="hypExplanation" rows={4} placeholder="Explain your reasoning…" />
          </div>

          <div className="form-row">
            <label htmlFor="hypAlternative">Alternative explanation</label>
            <textarea
              id="hypAlternative"
              rows={3}
              placeholder="What else could explain the evidence?"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary">
              Save hypothesis draft
            </button>
            <span className="saved-msg hidden">Saved</span>
          </div>
        </form>
      </div>
    </div>
  );
}
