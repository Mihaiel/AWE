// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// ---------------------------------------------------------------------
import { state } from "./state.js";

export const STORAGE_KEY_BOOKMARKS = "remotion_bookmarks";
export const STORAGE_KEY_NOTES = "remotion_notes";
export const STORAGE_KEY_HYPOTHESIS = "remotion_hypothesis";
// Exercise 5, Demo 9: see js/react/evidenceOverrides.ts for why this
// exists and who uses it - not read/written by the vanilla app.
export const STORAGE_KEY_EVIDENCE_OVERRIDES = "remotion_evidence_overrides";

export function saveBookmarksToStorage(): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    // JSON.parse()'s own return type is `any` - typing this as `unknown`
    // instead keeps that from silently leaking into state.bookmarks.
    // Exercise 2, Demo 5.
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    state.bookmarks = Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    state.bookmarks = [];
  }
}

export function saveNoteForEvidence(evidenceId: string, text: string): void {
  state.notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId: string): string {
  return state.notesStore[evidenceId] || "";
}

export function loadNotesFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY_NOTES);
  if (!raw) {
    state.notesStore = {};
    return;
  }

  // Same deal as loadBookmarksFromStorage() above - a hand-edited or
  // corrupted value here used to throw and take the whole app's boot
  // sequence down with it (setupEventListeners/loadAllData never ran
  // afterwards). See CHANGES.MD / Demo 5.
  try {
    state.notesStore = JSON.parse(raw) as Record<string, string>;
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}

export function loadNoteAsync(evidenceId: string): Promise<string> {
  return new Promise(function (resolve) {
    resolve(state.notesStore[evidenceId] || "");
  });
}
