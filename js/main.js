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
  saveCurrentNote
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
window.renderEvidenceList = renderEvidenceList; // needed by the setAttribute("onchange", ...) call below

function setupEventListeners() {
  window.addEventListener("hashchange", handleHashChange);

  var navButtons = document.querySelectorAll(".nav-btn");
  // let, not var: each click handler needs its own i, otherwise they
  // all share the one i left over after the loop ends. See Demo 5.
  for (let i = 0; i < navButtons.length; i++) {
    navButtons[i].addEventListener("click", function () {
      var targetView = navButtons[i].getAttribute("data-view");
      console.log("nav clicked:", targetView);
    });
  }

  document.getElementById("evidenceSearch").addEventListener("input", handleSearchInput);

  document.getElementById("filterType").addEventListener("change", renderEvidenceList);
  document.getElementById("filterPerson").addEventListener("change", renderEvidenceList);
  document.getElementById("filterLocation").addEventListener("change", renderEvidenceList);

  document.getElementById("filterStatus").addEventListener("change", renderEvidenceList);
  document.getElementById("filterStatus").setAttribute("onchange", "renderEvidenceList()");

  document.getElementById("filterRelevance").addEventListener("change", renderEvidenceList);

  document.getElementById("clearFiltersBtn").addEventListener("click", clearFilters);

  document.getElementById("timelineOrder").addEventListener("change", renderTimeline);
  document.getElementById("timelinePersonFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineLocationFilter").addEventListener("change", renderTimeline);
  document.getElementById("timelineTypeFilter").addEventListener("change", renderTimeline);

  document.getElementById("hypConfidence").addEventListener("input", function (e) {
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
