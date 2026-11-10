// ---------------------------------------------------------------------
// WORKSPACE VIEW (bookmarks, notes, hypothesis form)
// ---------------------------------------------------------------------
import { state } from "../state.js";
import { STORAGE_KEY_HYPOTHESIS } from "../storage.js";
import { optionHTML, getEl } from "../utils.js";
import { navigateTo } from "../router.js";
import { openEvidenceDetail } from "./evidence.js";

// Shape of the JSON this module itself writes to localStorage - not a
// domain type from data/*.json, so it stays local here rather than in
// types.ts. Exercise 2, Demo 7.
interface HypothesisDraft {
  suspectId?: string;
  nature?: string;
  evidenceIds?: string[];
  confidence?: string | number;
  explanation?: string;
  alternative?: string;
}

export function renderWorkspace(): void {
  renderBookmarksList();
  renderNotesList();
  populateHypothesisDropdowns();
  loadHypothesisFromStorage();
}

function renderBookmarksList(): void {
  const container = document.getElementById("bookmarksList");
  if (!container) return;

  const bookmarkedItems = state.allEvidence.filter(function (ev) {
    return ev.bookmarked;
  });

  if (bookmarkedItems.length === 0) {
    container.innerHTML =
      "<p>No bookmarked evidence yet. Bookmark items from the Evidence view.</p>";
    return;
  }

  let html = "";
  for (let i = 0; i < bookmarkedItems.length; i++) {
    const ev = bookmarkedItems[i]!;
    html +=
      '<div class="mini-list-item"><strong>' +
      ev.id +
      "</strong> &mdash; " +
      ev.title +
      ' <button type="button" class="btn btn-small btn-secondary" data-open-evidence="' +
      ev.id +
      '">Open</button></div>';
  }
  container.innerHTML = html;

  const openButtons = container.querySelectorAll("[data-open-evidence]");
  for (let b = 0; b < openButtons.length; b++) {
    openButtons[b]!.addEventListener("click", function (e) {
      navigateTo("evidence");
      const id = (e.target as HTMLElement).getAttribute("data-open-evidence")!;
      setTimeout(function () {
        openEvidenceDetail(id);
      }, 0);
    });
  }
}

function renderNotesList(): void {
  const container = document.getElementById("notesList");
  if (!container) return;

  const noteEntries: { index: number; evidenceId: string; title: string; text: string }[] = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const note = state.notesStore[state.allEvidence[i]!.id];
    if (note) {
      noteEntries.push({
        index: i,
        evidenceId: state.allEvidence[i]!.id,
        title: state.allEvidence[i]!.title,
        text: note,
      });
    }
  }

  if (noteEntries.length === 0) {
    container.innerHTML = "<p>No notes yet. Add one from an evidence item's detail view.</p>";
    return;
  }

  let html = "";
  for (let n = 0; n < noteEntries.length; n++) {
    const entry = noteEntries[n]!;
    html +=
      '<div class="mini-list-item"><strong>' +
      entry.evidenceId +
      "</strong> &mdash; " +
      entry.title;
    html += '<div id="noteText-' + entry.index + '">' + entry.text + "</div></div>"; // unsafe innerHTML rendering, same as the note preview
  }
  container.innerHTML = html;
}

export function populateHypothesisDropdowns(): void {
  const suspectSelect = document.getElementById("hypSuspect") as HTMLSelectElement | null;
  const evidenceSelect = document.getElementById("hypEvidence") as HTMLSelectElement | null;
  if (!suspectSelect || !evidenceSelect) return;

  const currentSuspect = suspectSelect.value;
  suspectSelect.innerHTML = optionHTML("", "Select a person…");
  for (let p = 0; p < state.allPeople.length; p++) {
    suspectSelect.innerHTML += optionHTML(state.allPeople[p]!.id, state.allPeople[p]!.name);
  }
  suspectSelect.value = currentSuspect;

  evidenceSelect.innerHTML = "";
  for (let i = 0; i < state.allEvidence.length; i++) {
    evidenceSelect.innerHTML += optionHTML(
      state.allEvidence[i]!.id,
      state.allEvidence[i]!.id + " - " + state.allEvidence[i]!.title,
    );
  }
}

export function saveHypothesis(): void {
  const draft: HypothesisDraft = {
    suspectId: getEl<HTMLSelectElement>("hypSuspect").value,
    nature: getEl<HTMLSelectElement>("hypNature").value,
    evidenceIds: getSelectedOptions(getEl<HTMLSelectElement>("hypEvidence")),
    confidence: getEl<HTMLInputElement>("hypConfidence").value,
    explanation: getEl<HTMLTextAreaElement>("hypExplanation").value,
    alternative: getEl<HTMLTextAreaElement>("hypAlternative").value,
  };
  const draftWithTimestamp = { ...draft, savedAt: new Date().toISOString() };

  try {
    localStorage.setItem(STORAGE_KEY_HYPOTHESIS, JSON.stringify(draftWithTimestamp));
  } catch (err) {
    console.error("Could not save hypothesis draft", err);
    alert("Your hypothesis could not be saved to local storage.");
    return;
  }

  const msg = getEl("hypothesisSavedMsg");
  msg.classList.remove("hidden");
  setTimeout(function () {
    msg.classList.add("hidden");
  }, 2000);
}

function getSelectedOptions(selectEl: HTMLSelectElement): string[] {
  const result: string[] = [];
  for (let i = 0; i < selectEl.options.length; i++) {
    if (selectEl.options[i]!.selected) result.push(selectEl.options[i]!.value);
  }
  return result;
}

function loadHypothesisFromStorage(): void {
  const raw = localStorage.getItem(STORAGE_KEY_HYPOTHESIS);
  if (!raw) return;

  // A corrupted value here used to throw out of renderWorkspace(), which
  // skipped restoring the draft silently (console error, same otherwise).
  // See CHANGES.MD / Demo 5.
  // let, not const: it has no initial value here, it's only assigned
  // inside the try block below.
  let draft: HypothesisDraft;
  try {
    draft = JSON.parse(raw) as HypothesisDraft;
  } catch (err) {
    console.warn("Could not read stored hypothesis draft, ignoring it", err);
    return;
  }

  (getEl("hypSuspect") as HTMLSelectElement).value = draft.suspectId || "";
  (getEl("hypNature") as HTMLSelectElement).value = draft.nature || "";
  (getEl("hypConfidence") as HTMLInputElement).value = String(draft.confidence || 50);
  getEl("hypConfidenceValue").textContent = String(draft.confidence || 50);
  (getEl("hypExplanation") as HTMLTextAreaElement).value = draft.explanation || "";
  (getEl("hypAlternative") as HTMLTextAreaElement).value = draft.alternative || "";

  const evidenceSelect = getEl<HTMLSelectElement>("hypEvidence");
  const savedIds = draft.evidenceIds || [];
  for (let i = 0; i < evidenceSelect.options.length; i++) {
    evidenceSelect.options[i]!.selected = savedIds.indexOf(evidenceSelect.options[i]!.value) !== -1;
  }
}
