// ---------------------------------------------------------------------
// ENTRY POINT - wires up navigation and event listeners on startup
// ---------------------------------------------------------------------
import { loadBookmarksFromStorage, loadNotesFromStorage, loadNoteAsync } from "./storage.js";
import { navigateTo, handleHashChange } from "./router.js";
import { loadAllData } from "./dataLoader.js";
import {
  renderEvidenceList,
  handleSearchInput,
  handleSortChange,
  clearFilters,
  closeEvidenceDetail,
  saveCurrentNote,
} from "./views/evidence.js";
import { renderTimeline } from "./views/timeline.js";
import { switchPeopleTab } from "./views/people.js";
import { saveHypothesis } from "./views/workspace.js";

// index.html (and some HTML generated in the view modules) still calls
// these straight from inline onclick/onchange attributes, which look
// the function up on window the moment they fire. A module's top-level
// functions don't attach to window automatically the way a classic
// script's do, so these need exposing by hand or the markup breaks.
// See CHANGES.MD for the full story.
window.navigateTo = navigateTo;
window.switchPeopleTab = switchPeopleTab;
window.handleSortChange = handleSortChange;
window.saveHypothesis = saveHypothesis;
window.closeEvidenceDetail = closeEvidenceDetail;
window.saveCurrentNote = saveCurrentNote;
// renderEvidenceList used to also need exposing here, for a redundant
// setAttribute("onchange", ...) call removed in Demo 8 - nothing reads
// it off window anymore, so it stays module-private now.

function setupEventListeners() {
  window.addEventListener("hashchange", handleHashChange);

  const navButtons = document.querySelectorAll(".nav-btn");
  // let, not var: each click handler needs its own i, otherwise they
  // all share the one i left over after the loop ends. See Demo 5.
  for (let i = 0; i < navButtons.length; i++) {
    // Arrow function, Demo 10: doesn't use `this` (reads navButtons[i]
    // from the closure instead, same as before), so nothing changes by
    // converting it.
    navButtons[i].addEventListener("click", () => {
      const targetView = navButtons[i].getAttribute("data-view");
      console.log("nav clicked:", targetView);
    });
  }

  document.getElementById("evidenceSearch").addEventListener("input", handleSearchInput);

  document.getElementById("filterType").addEventListener("change", renderEvidenceList);
  document.getElementById("filterPerson").addEventListener("change", renderEvidenceList);
  document.getElementById("filterLocation").addEventListener("change", renderEvidenceList);

  // Used to also get a second, redundant listener via
  // setAttribute("onchange", "renderEvidenceList()") here - that ran
  // renderEvidenceList() twice per change for no reason. Code smell
  // fixed in Demo 8, see CHANGES.MD.
  document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);

  document.getElementById("filterRelevance").addEventListener("change", renderEvidenceList);

  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);

  document.getElementById("timelineOrder").addEventListener("change", renderTimeline);
  document.getElementById("timelinePersonFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineLocationFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineTypeFilter").addEventListener("change", renderTimeline);

  // Arrow function, Demo 10: another plain callback, no `this` needed.
  document.getElementById("hypConfidence").addEventListener("input", (e) => {
    document.getElementById("hypConfidenceValue").textContent = e.target.value;
  });
}

function initApp() {
  loadBookmarksFromStorage();
  loadNotesFromStorage();
  setupEventListeners();

  loadAllData().then(function () {
    handleHashChange();
    // loadNoteAsync() returns a Promise - it has to be awaited/chained,
    // otherwise this logs the Promise object instead of the note text.
    // See CHANGES.MD / Demo 4.
    loadNoteAsync("E01").then(function (firstNote) {
      console.log("First note preview:", firstNote);
    });
  });
}

window.addEventListener("DOMContentLoaded", initApp);
window.addEventListener("hashchange", handleHashChange);
