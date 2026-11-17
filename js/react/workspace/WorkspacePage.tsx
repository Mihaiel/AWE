// ---------------------------------------------------------------------
// WORKSPACE PAGE - Exercise 5 Demo 1, hypothesis form controlled in Demo 2
// ---------------------------------------------------------------------
// Static structure for all three pieces the vanilla workspace.ts built:
// the bookmarked-evidence list, the notes list, and the hypothesis
// form. None of Demo 1's 3 chosen event-handler migrations (bookmark
// click, search input, save-note click) live here, they're all on the
// Evidence side - this page only needs to read the results of the
// bookmark/note handlers that live in EvidencePage/EvidenceDetail, via
// the same localStorage keys.
//
// Demo 5: bookmarks arrived as a prop from App.tsx, the common
// ancestor this page shares with EvidencePage and DashboardPage,
// instead of this page reading localStorage independently on its own
// mount.
//
// Demo 8: and now useBookmarks() reads them straight from
// BookmarksContext instead of a prop - no change in behavior, just one
// fewer hand-off along the way. See BookmarksContext.tsx and
// EXERCISE_5.md Demo 8.
//
// Demo 9: applyEvidenceOverrides() re-applies any status/relevance
// edits saved from the Evidence detail view, same reason as
// DashboardPage's own comment - this page doesn't currently display
// status/relevance anywhere, but keeping every page's `data.evidence`
// equally overridden means there's one consistent picture of "the
// current evidence", not three that quietly disagree. See
// evidenceOverrides.ts and EXERCISE_5.md Demo 9.
//
// Demo 9 also fixed a second issue here: handleSaveDraft's setTimeout
// had no cleanup, so navigating away from this page within the 2s
// "Saved" window left a timer that would still try to call
// setShowSaved() on an already-unmounted component. savedTimeoutRef
// below tracks the pending timeout so it can be cleared on unmount (or
// before starting a new one).
//
// Exercise 6, Demo 1: `notes` used to be `readNotes()` called directly
// in the render body, every render - a side effect during render
// (reading a mutable external store), even though it "worked" because
// it's a read, not a write, and this page always remounts fresh on
// navigation anyway. Now `localStorage.getItem(STORAGE_KEY_NOTES)` only
// runs once, via useState's lazy initializer, same pattern `draft`
// right below already used. See EXERCISE_6.md Demo 1.
//
// Demo 2: the hypothesis form is one `useState<HypothesisDraft>`, not
// 6 separate useState calls. These 6 fields are never read, reset, or
// saved independently, every one of them is only ever used as part of
// "the current draft", read together by handleSaveDraft() and
// persisted as a single JSON blob, exactly like the vanilla version's
// own HypothesisDraft interface already modeled it. One state value
// per true "thing being tracked" beats one state value per DOM field.
// See EXERCISE_5.md Demo 2 for why this is the right call for this
// particular form but not the only one (Demo 7 revisits this same
// question for the evidence filters, a seven-field domain that - unlike
// this one - does need individual field updates plus a few named bulk
// operations, which is what makes it useReducer's job instead).
//
// Exercise 6, Demo 5: the 2 fetch() calls below now hit the dev-only
// backend instead of the static data/*.json files. See
// DashboardPage.tsx's own comment and EXERCISE_6.md Demo 5.
import { useEffect, useRef, useState } from "react";
import type { Evidence, Person } from "../../types.js";
import { STORAGE_KEY_NOTES, STORAGE_KEY_HYPOTHESIS } from "../../storage.js";
import { useBookmarks } from "../BookmarksContext.js";
import { applyEvidenceOverrides } from "../evidenceOverrides.js";
import { API_BASE_URL } from "../apiConfig.js";

interface WorkspaceData {
  evidence: Evidence[];
  people: Person[];
}

interface HypothesisDraft {
  suspectId: string;
  nature: string;
  evidenceIds: string[];
  confidence: number;
  explanation: string;
  alternative: string;
}

const EMPTY_DRAFT: HypothesisDraft = {
  suspectId: "",
  nature: "",
  evidenceIds: [],
  confidence: 50,
  explanation: "",
  alternative: "",
};

function readHypothesisDraft(): HypothesisDraft {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw) as Partial<HypothesisDraft>;
    return { ...EMPTY_DRAFT, ...parsed };
  } catch {
    return EMPTY_DRAFT;
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
  const { bookmarks } = useBookmarks();
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [draft, setDraft] = useState<HypothesisDraft>(readHypothesisDraft);
  const [notes] = useState(readNotes);
  const [showSaved, setShowSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clears any pending "hide the Saved message" timer left over from a
  // save that happened right before this component unmounted - without
  // this, that timer would still fire 2s later and call setShowSaved()
  // on a component that's already gone. See this file's own top comment
  // (Demo 9) and EXERCISE_5.md Demo 9.
  useEffect(() => {
    return () => {
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [evidenceRes, peopleRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/evidence`),
        fetch(`${API_BASE_URL}/api/people`),
      ]);
      const evidenceJson: unknown = await evidenceRes.json();
      const peopleJson: unknown = await peopleRes.json();

      if (!cancelled) {
        setData({
          evidence: applyEvidenceOverrides(evidenceJson as Evidence[]),
          people: peopleJson as Person[],
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

  const bookmarkedEvidence = data.evidence.filter((ev) => bookmarks.includes(ev.id));
  // Key by evidence.id, not array position - the exact fix for Exercise
  // 4 Demo 4's "index used as identifier" bug this app already diagnosed
  // once, in the vanilla version of this exact list.
  const noteEntries = data.evidence
    .filter((ev) => notes[ev.id])
    .map((ev) => ({ evidenceId: ev.id, title: ev.title, text: notes[ev.id]! }));

  function updateDraft<K extends keyof HypothesisDraft>(key: K, value: HypothesisDraft[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSaveDraft() {
    localStorage.setItem(
      STORAGE_KEY_HYPOTHESIS,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    );
    setShowSaved(true);
    if (savedTimeoutRef.current) {
      clearTimeout(savedTimeoutRef.current);
    }
    savedTimeoutRef.current = setTimeout(() => setShowSaved(false), 2000);
  }

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
            <select
              id="hypSuspect"
              value={draft.suspectId}
              onChange={(event) => updateDraft("suspectId", event.target.value)}
            >
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
            <select
              id="hypNature"
              value={draft.nature}
              onChange={(event) => updateDraft("nature", event.target.value)}
            >
              <option value="">Select&hellip;</option>
              <option value="accidental">Accidental</option>
              <option value="deliberate">Deliberate</option>
              <option value="unclear">Unclear</option>
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="hypEvidence">Selected supporting evidence</label>
            <select
              id="hypEvidence"
              multiple
              size={6}
              value={draft.evidenceIds}
              onChange={(event) =>
                updateDraft(
                  "evidenceIds",
                  Array.from(event.target.selectedOptions, (option) => option.value),
                )
              }
            >
              {data.evidence.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.id} - {ev.title}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <label htmlFor="hypConfidence">Confidence (0&ndash;100)</label>
            <input
              type="range"
              id="hypConfidence"
              min={0}
              max={100}
              value={draft.confidence}
              onChange={(event) => updateDraft("confidence", Number(event.target.value))}
            />
            <output id="hypConfidenceValue">{draft.confidence}</output>
          </div>

          <div className="form-row">
            <label htmlFor="hypExplanation">Written explanation</label>
            <textarea
              id="hypExplanation"
              rows={4}
              placeholder="Explain your reasoning…"
              value={draft.explanation}
              onChange={(event) => updateDraft("explanation", event.target.value)}
            />
          </div>

          <div className="form-row">
            <label htmlFor="hypAlternative">Alternative explanation</label>
            <textarea
              id="hypAlternative"
              rows={3}
              placeholder="What else could explain the evidence?"
              value={draft.alternative}
              onChange={(event) => updateDraft("alternative", event.target.value)}
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-primary" onClick={handleSaveDraft}>
              Save hypothesis draft
            </button>
            {showSaved && <span className="saved-msg">Saved</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
