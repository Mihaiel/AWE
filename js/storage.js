// ---------------------------------------------------------------------
// LOCAL STORAGE HELPERS (bookmarks & notes)
// ---------------------------------------------------------------------
import { state } from "./state.js";

export const STORAGE_KEY_BOOKMARKS = "remotion_bookmarks";
export const STORAGE_KEY_NOTES = "remotion_notes";
export const STORAGE_KEY_HYPOTHESIS = "remotion_hypothesis";

export function saveBookmarksToStorage() {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(state.bookmarks));
}

export function loadBookmarksFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed = raw ? JSON.parse(raw) : [];
    state.bookmarks = Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Could not read stored bookmarks, starting empty", err);
    state.bookmarks = [];
  }
}

export function saveNoteForEvidence(evidenceId, text) {
  state.notesStore[evidenceId] = text;
  localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(state.notesStore));
}

export function loadNoteForEvidence(evidenceId) {
  return state.notesStore[evidenceId] || "";
}

export function loadNotesFromStorage() {
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
    state.notesStore = JSON.parse(raw);
  } catch (err) {
    console.warn("Could not read stored notes, starting empty", err);
    state.notesStore = {};
  }
}

export function loadNoteAsync(evidenceId) {
  return new Promise(function (resolve) {
    resolve(state.notesStore[evidenceId] || "");
  });
}
