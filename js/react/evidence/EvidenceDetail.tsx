// ---------------------------------------------------------------------
// EVIDENCE DETAIL - Exercise 5 Demo 1
// ---------------------------------------------------------------------
// Same fields as the vanilla renderEvidenceDetail() in js/views/evidence.ts.
//
// Demo 6: the status/relevance <select>s are now controlled and wired,
// via onStatusChange/onRelevanceChange callbacks passed down from
// EvidencePage - the actual `evidence` array they change lives there,
// not here, so this component can't update it directly. It just calls
// the callback with (evidence.id, newValue); EvidencePage owns the
// immutable update. Same "callback down, not a reach-up mutation"
// shape as EvidenceCard's onToggleBookmark.
//
// The note textarea and "Save note" button ARE one of this demo's real
// migrated handlers: vanilla read the textarea's value back off the DOM
// with document.getElementById("evidenceNoteInput") inside a plain
// onclick="saveCurrentNote()" attribute, then wrote the preview back in
// with preview.innerHTML = text (unsafe on purpose, per that file's own
// comment). Here the textarea is a controlled input (its value lives in
// React state, not read back from the DOM afterward) and the preview
// below is a plain JSX expression, not innerHTML.
import { useState } from "react";
import type { Evidence, Person, Location } from "../../types.js";
import { formatDate } from "../../utils.js";
import { STORAGE_KEY_NOTES } from "../../storage.js";

interface EvidenceDetailProps {
  evidence: Evidence;
  people: Person[];
  locations: Location[];
  onClose: () => void;
  onStatusChange: (evidenceId: string, status: string) => void;
  onRelevanceChange: (evidenceId: string, relevance: string) => void;
}

function readNotesStore(): Record<string, string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_NOTES);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeNote(evidenceId: string, text: string): void {
  const notes = readNotesStore();
  notes[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(notes));
}

export default function EvidenceDetail({
  evidence,
  people,
  locations,
  onClose,
  onStatusChange,
  onRelevanceChange,
}: EvidenceDetailProps) {
  const [noteDraft, setNoteDraft] = useState(() => readNotesStore()[evidence.id] || "");
  const [savedNote, setSavedNote] = useState(() => readNotesStore()[evidence.id] || "");

  // Dual id/name check, same reasoning as utils.ts's evidenceMentionsPerson:
  // evidence.json's personIds isn't reliably one or the other.
  const personNames = evidence.personIds.map((id) => {
    const person = people.find((p) => p.id === id || p.name === id);
    return person ? person.name : id;
  });
  const locationNames = evidence.locationIds.map((id) => {
    const location = locations.find((l) => l.id === id);
    return location ? `${location.id} - ${location.name}` : id;
  });

  function handleSaveNote() {
    writeNote(evidence.id, noteDraft);
    setSavedNote(noteDraft);
  }

  return (
    <div className="evidence-detail">
      <div className="evidence-detail-header">
        <div>
          <h2>{evidence.title}</h2>
          <div className="evidence-meta">
            {evidence.id} &middot; {evidence.type} &middot; {formatDate(evidence.timestamp)}
          </div>
        </div>
        <button type="button" className="btn btn-secondary btn-small" onClick={onClose}>
          Close
        </button>
      </div>

      {evidence.tags.includes("critical") && (
        <div className="warning-banner">This item is tagged as critical evidence.</div>
      )}

      <div className="detail-field">
        <strong>Summary</strong>
        {evidence.summary}
      </div>
      <div className="evidence-detail-content">{evidence.content}</div>
      <div className="detail-field">
        <strong>Related people</strong>
        {personNames.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Related locations</strong>
        {locationNames.join(", ")}
      </div>
      <div className="detail-field">
        <strong>Tags</strong>
        {evidence.tags.map((tag) => (
          <span key={tag} className="tag-chip">
            {tag}
          </span>
        ))}
      </div>

      <div className="detail-field">
        <strong>Review status</strong>
        <select
          value={evidence.status}
          onChange={(event) => onStatusChange(evidence.id, event.target.value)}
        >
          <option value="unreviewed">Unreviewed</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      <div className="detail-field">
        <strong>Relevance</strong>
        <select
          value={evidence.relevance}
          onChange={(event) => onRelevanceChange(evidence.id, event.target.value)}
        >
          <option value="unknown">Unknown</option>
          <option value="relevant">Relevant</option>
          <option value="irrelevant">Irrelevant</option>
        </select>
      </div>

      <div className="detail-field">
        <strong>Investigator note</strong>
        <textarea
          className="note-textarea"
          rows={3}
          placeholder="Add a private note about this evidence..."
          value={noteDraft}
          onChange={(event) => setNoteDraft(event.target.value)}
        />
        <button
          type="button"
          className="btn btn-primary btn-small"
          style={{ marginTop: "6px" }}
          onClick={handleSaveNote}
        >
          Save note
        </button>
      </div>

      <div className="detail-field">
        <strong>Note preview</strong>
        <div>{savedNote}</div>
      </div>
    </div>
  );
}
