// ---------------------------------------------------------------------
// EVIDENCE CATALOGUE + EVIDENCE DETAIL
// ---------------------------------------------------------------------
import { state } from "../state.js";
import {
  findEvidenceById,
  findPersonById,
  findLocationById,
  evidenceMentionsPerson,
  formatDate,
  getStatusBadgeClass,
  getRelevanceBadgeClass,
  optionHTML,
  getEl,
} from "../utils.js";
import { saveBookmarksToStorage, saveNoteForEvidence, loadNoteForEvidence } from "../storage.js";
import type { Evidence } from "../types.js";

// Flips to false once the evidence fetch actually resolves - see
// markEvidenceDataLoaded() below. Fixed in Demo 3, see CHANGES.MD.
let evidenceViewLoading = true;

// Called once from dataLoader.ts, right after the evidence.json fetch
// resolves, so this module's own loading flag matches reality.
export function markEvidenceDataLoaded(): void {
  evidenceViewLoading = false;
}

// Just here to ignore stale search responses.
let latestSearchRequestId = 0;

export function populateEvidenceDropdowns(): void {
  const typeSelect = document.getElementById("filterType") as HTMLSelectElement | null;
  const personSelect = document.getElementById("filterPerson") as HTMLSelectElement | null;
  const locationSelect = document.getElementById("filterLocation") as HTMLSelectElement | null;
  if (!typeSelect || !personSelect || !locationSelect) return;

  const types: string[] = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const t = state.allEvidence[i]!.type.toLowerCase();
    if (types.indexOf(t) === -1) types.push(t);
  }
  typeSelect.innerHTML = optionHTML("", "All types");
  for (let ti = 0; ti < types.length; ti++) {
    typeSelect.innerHTML += optionHTML(types[ti]!, types[ti]!);
  }

  personSelect.innerHTML = optionHTML("", "All people");
  for (let p = 0; p < state.allPeople.length; p++) {
    personSelect.innerHTML += optionHTML(state.allPeople[p]!.id, state.allPeople[p]!.name);
  }

  locationSelect.innerHTML = optionHTML("", "All locations");
  for (let l = 0; l < state.allLocations.length; l++) {
    locationSelect.innerHTML += optionHTML(
      state.allLocations[l]!.id,
      state.allLocations[l]!.id + " - " + state.allLocations[l]!.name,
    );
  }
}

export function getFilteredEvidence(): Evidence[] {
  const searchBox = document.getElementById("evidenceSearch") as HTMLInputElement | null;
  const searchTerm = searchBox ? searchBox.value.toLowerCase().trim() : "";
  const typeVal = getEl<HTMLSelectElement>("filterType").value;
  const personVal = getEl<HTMLSelectElement>("filterPerson").value;
  const locationVal = getEl<HTMLSelectElement>("filterLocation").value;
  const statusVal = getEl<HTMLSelectElement>("filterStatus").value;
  const relevanceVal = getEl<HTMLSelectElement>("filterRelevance").value;

  const results: Evidence[] = [];
  for (let i = 0; i < state.allEvidence.length; i++) {
    const item = state.allEvidence[i]!;
    // let, not const: flipped to false by any of the checks below.
    let matches = true;

    if (searchTerm) {
      const haystack = (item.title + " " + item.summary + " " + item.tags.join(" ")).toLowerCase();
      if (haystack.indexOf(searchTerm) === -1) matches = false;
    }
    if (matches && typeVal && item.type.toLowerCase() !== typeVal) matches = false;
    if (matches && personVal) {
      const person = findPersonById(personVal);
      if (!person || !evidenceMentionsPerson(item, person)) matches = false;
    }
    if (matches && locationVal && item.locationIds.indexOf(locationVal) === -1) matches = false;
    if (matches && statusVal && (item.status || "").toLowerCase() !== statusVal) matches = false;
    if (matches && relevanceVal && (item.relevance || "").toLowerCase() !== relevanceVal)
      matches = false;

    if (matches) results.push(item);
  }

  state.filteredEvidence = results;
  return results;
}

export function renderEvidenceList(): void {
  const container = document.getElementById("evidenceList");
  if (!container) return;

  const loadingIndicator = document.getElementById("evidenceLoadingIndicator");
  if (evidenceViewLoading) {
    if (loadingIndicator) loadingIndicator.classList.remove("hidden");
    container.innerHTML = "";
    return;
  }
  if (loadingIndicator) loadingIndicator.classList.add("hidden");

  const results = getFilteredEvidence();

  // let, not const: reassigned below when there are no results.
  let html = "";
  if (results.length === 0) {
    html = "<p>No evidence matches the current filters.</p>";
  }
  for (let i = 0; i < results.length; i++) {
    html += renderEvidenceCardHTML(results[i]!);
  }
  container.innerHTML = html;

  // Event delegation for card clicks / bookmark button.
  container.addEventListener("click", handleEvidenceListClick);
}

function renderEvidenceCardHTML(ev: Evidence): string {
  const isBookmarked = state.bookmarks.indexOf(ev.id) !== -1;
  let html = '<div class="evidence-card" data-id="' + ev.id + '">';
  html +=
    '<button class="bookmark-btn ' +
    (isBookmarked ? "active" : "") +
    '" data-action="bookmark" data-id="' +
    ev.id +
    '" aria-label="Toggle bookmark for ' +
    ev.title +
    '"><span class="bookmark-icon">' +
    (isBookmarked ? "★" : "☆") +
    "</span></button>";
  html += "<h3>" + ev.title + "</h3>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div>";
  html += '<div class="evidence-summary">' + ev.summary + "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<span class="badge badge-critical">Critical</span>';
  }
  html += '<span class="badge ' + getStatusBadgeClass(ev.status) + '">' + ev.status + "</span>";
  html +=
    '<span class="badge ' + getRelevanceBadgeClass(ev.relevance) + '">' + ev.relevance + "</span>";
  html += "<div>";
  for (let t = 0; t < ev.tags.length; t++) {
    html += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }
  html += "</div>";
  html += "</div>";
  return html;
}

// Deliberately NOT an arrow function, Demo 10: this is passed straight
// to addEventListener by reference (container.addEventListener("click",
// handleEvidenceListClick) above), the idiomatic way to write a DOM
// handler like this uses `this`/`event.currentTarget` for "the element
// the listener is attached to" (this one uses event.target instead, but
// that's a choice, not a requirement). Converting it to an arrow would
// permanently rule out ever using `this` here, since an arrow's `this`
// is fixed to whatever it was when the function was defined (the module
// scope, i.e. undefined), not the element it ends up attached to. A
// plain function keeps that door open; see CHANGES.MD for the longer
// version of this.
function handleEvidenceListClick(event: Event): void {
  const target = event.target as HTMLElement;

  if (target.dataset && target.dataset.action === "bookmark") {
    event.stopPropagation();
    handleBookmarkClick(target.dataset.id!);
    return;
  }

  const card = target.closest(".evidence-card");
  if (card) {
    openEvidenceDetail(card.getAttribute("data-id")!);
  }
}

function handleBookmarkClick(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  if (state.bookmarks.indexOf(evidenceId) === -1) {
    state.bookmarks.push(evidenceId);
    ev.bookmarked = true;
  } else {
    state.bookmarks = state.bookmarks.filter(function (id) {
      return id !== evidenceId;
    });
    ev.bookmarked = false;
  }
  saveBookmarksToStorage();
  if (state.currentPage === "evidence") renderEvidenceList();
}

export function applyStoredBookmarkFlags(): void {
  for (let i = 0; i < state.allEvidence.length; i++) {
    state.allEvidence[i]!.bookmarked = state.bookmarks.indexOf(state.allEvidence[i]!.id) !== -1;
  }
}

export function handleSortChange(): void {
  const sortValue = getEl<HTMLSelectElement>("sortEvidence").value;

  if (sortValue === "title-asc") {
    state.filteredEvidence.sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
  } else if (sortValue === "title-desc") {
    state.filteredEvidence.sort(function (a, b) {
      return b.title.localeCompare(a.title);
    });
  } else if (sortValue === "date-asc") {
    state.filteredEvidence.sort(function (a, b) {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    });
  } else {
    state.filteredEvidence.sort(function (a, b) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }
  renderEvidenceList();
}

export function clearFilters(): void {
  (getEl("evidenceSearch") as HTMLInputElement).value = "";
  (getEl("filterType") as HTMLSelectElement).value = "";
  (getEl("filterPerson") as HTMLSelectElement).value = "";
  (getEl("filterLocation") as HTMLSelectElement).value = "";
  (getEl("filterStatus") as HTMLSelectElement).value = "";
  (getEl("filterRelevance") as HTMLSelectElement).value = "";
  renderEvidenceList();
}

function simulateAsyncSearch(term: string): Promise<string> {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(term);
    }, 300);
  });
}

export function handleSearchInput(event: Event): void {
  const term = (event.target as HTMLInputElement).value;
  const requestId = ++latestSearchRequestId;

  simulateAsyncSearch(term).then(function () {
    // Only apply this response if nothing newer has been typed meanwhile.
    if (requestId !== latestSearchRequestId) return;
    renderEvidenceList();
  });
}

// ---------------------------------------------------------------------
// EVIDENCE DETAIL
// ---------------------------------------------------------------------

export function openEvidenceDetail(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  const section = getEl("evidenceDetailSection");
  section.classList.remove("hidden");

  renderEvidenceDetail(ev);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function closeEvidenceDetail(): void {
  const section = getEl("evidenceDetailSection");
  section.classList.add("hidden");
  section.innerHTML = "";
}

function renderEvidenceDetail(ev: Evidence): void {
  const section = getEl("evidenceDetailSection");

  const personNames: string[] = [];
  for (let p = 0; p < ev.personIds.length; p++) {
    const person = findPersonById(ev.personIds[p]!);
    personNames.push(person ? person.name : ev.personIds[p]!);
  }

  const locationNames: string[] = [];
  for (let l = 0; l < ev.locationIds.length; l++) {
    const loc = findLocationById(ev.locationIds[l]!);
    locationNames.push(loc ? loc.id + " - " + loc.name : ev.locationIds[l]!);
  }

  let tagsHtml = "";
  for (let t = 0; t < ev.tags.length; t++) {
    tagsHtml += '<span class="tag-chip">' + ev.tags[t] + "</span>";
  }

  const storedNote = loadNoteForEvidence(ev.id);

  let html = "";
  html += '<div class="evidence-detail-header">';
  html += "<div><h2>" + ev.title + "</h2>";
  html +=
    '<div class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</div></div>";
  html +=
    '<button type="button" class="btn btn-secondary btn-small" onclick="closeEvidenceDetail()">Close</button>';
  html += "</div>";

  if (ev.tags.indexOf("critical") !== -1) {
    html += '<div class="warning-banner">This item is tagged as critical evidence.</div>';
  }

  html += '<div class="detail-field"><strong>Summary</strong>' + ev.summary + "</div>";
  html += '<div class="evidence-detail-content">' + ev.content + "</div>";
  html +=
    '<div class="detail-field"><strong>Related people</strong>' + personNames.join(", ") + "</div>";
  html +=
    '<div class="detail-field"><strong>Related locations</strong>' +
    locationNames.join(", ") +
    "</div>";
  html += '<div class="detail-field"><strong>Tags</strong>' + tagsHtml + "</div>";

  html += '<div class="detail-field"><strong>Review status</strong>';
  html += '<select id="detailStatusSelect">';
  html += statusOptionHTML(ev.status, "unreviewed", "Unreviewed");
  html += statusOptionHTML(ev.status, "reviewed", "Reviewed");
  html += statusOptionHTML(ev.status, "flagged", "Flagged");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Relevance</strong>';
  html += '<select id="detailRelevanceSelect">';
  html += statusOptionHTML(ev.relevance, "unknown", "Unknown");
  html += statusOptionHTML(ev.relevance, "relevant", "Relevant");
  html += statusOptionHTML(ev.relevance, "irrelevant", "Irrelevant");
  html += "</select></div>";

  html += '<div class="detail-field"><strong>Investigator note</strong>';
  html +=
    '<textarea id="evidenceNoteInput" class="note-textarea" rows="3" data-evidence-id="' +
    ev.id +
    '" placeholder="Add a private note about this evidence...">' +
    storedNote +
    "</textarea>";
  html +=
    '<button type="button" class="btn btn-primary btn-small" style="margin-top:6px;" onclick="saveCurrentNote()">Save note</button>';
  html += "</div>";

  html +=
    '<div class="detail-field"><strong>Note preview</strong><div id="notePreview">' +
    storedNote +
    "</div></div>";

  section.innerHTML = html;

  // Arrow functions, Demo 10: neither one uses `this`, both just close
  // over `ev` the same way a function expression would have.
  getEl<HTMLSelectElement>("detailStatusSelect").addEventListener("change", (e) => {
    ev.status = (e.target as HTMLSelectElement).value; // direct mutation of the loaded evidence object
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
  getEl<HTMLSelectElement>("detailRelevanceSelect").addEventListener("change", (e) => {
    ev.relevance = (e.target as HTMLSelectElement).value;
    renderEvidenceDetail(ev);
    if (state.viewRendered.evidence) renderEvidenceList();
  });
}

function statusOptionHTML(current: string | undefined, value: string, label: string): string {
  const currentLower = (current || "").toLowerCase();
  const selected = currentLower === value ? " selected" : "";
  return '<option value="' + value + '"' + selected + ">" + label + "</option>";
}

export function saveCurrentNote(): void {
  const textarea = document.getElementById("evidenceNoteInput") as HTMLTextAreaElement | null;
  if (!textarea) return;
  const evidenceId = textarea.getAttribute("data-evidence-id")!; // note id is read back off the DOM
  const text = textarea.value;
  saveNoteForEvidence(evidenceId, text);
  const preview = document.getElementById("notePreview");
  if (preview) preview.innerHTML = text; // unsafe on purpose, see above
}
