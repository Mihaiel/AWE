// ---------------------------------------------------------------------
// DATA LOADING
// ---------------------------------------------------------------------
import { state } from "./state.js";
import { renderDashboard } from "./views/dashboard.js";
import {
  renderEvidenceList,
  populateEvidenceDropdowns,
  applyStoredBookmarkFlags,
  markEvidenceDataLoaded,
} from "./views/evidence.js";
import { renderTimeline, populateTimelineDropdowns } from "./views/timeline.js";
import { populateHypothesisDropdowns } from "./views/workspace.js";

// Only the two functions below need this.
let loadingStepsRemaining = 2;

export function showLoadingOverlay(msg) {
  const overlay = document.getElementById("loadingOverlay");
  const text = document.getElementById("loadingText");
  if (text) text.textContent = msg;
  if (overlay) overlay.classList.remove("hidden");
}

function hideLoadingStep() {
  loadingStepsRemaining--;
  if (loadingStepsRemaining <= 0) {
    const overlay = document.getElementById("loadingOverlay");
    if (overlay) overlay.classList.add("hidden");
  }
}

// Was a 6-level-deep .then() chain (fetch->json->fetch->json->fetch->json),
// one fetch had to fully resolve before the next even started. Rewritten
// as async/await, same exact sequential order, nothing parallelized -
// that's a later exercise. See CHANGES.MD / Demo 9.
async function loadCorePeopleAndLocations() {
  const caseRes = await fetch("data/case.json");
  const caseJson = await caseRes.json();
  state.caseData = caseJson;

  const peopleRes = await fetch("data/people.json");
  const peopleJson = await peopleRes.json();
  state.allPeople = peopleJson;

  const locationsRes = await fetch("data/locations.json");
  const locationsJson = await locationsRes.json();
  state.allLocations = locationsJson;

  hideLoadingStep();
  renderDashboard();
  populateAllDropdowns();
}

function loadEvidenceData() {
  fetch("data/evidence.json")
    .then(function (res) {
      return res.json();
    })
    .then(function (data) {
      state.allEvidence = data;
      applyStoredBookmarkFlags();
      // .slice() on purpose - filteredEvidence has to be its own array, not
      // the same one as allEvidence. See CHANGES.MD / Demo 2 for why.
      state.filteredEvidence = state.allEvidence.slice();
      // The fetch has now actually resolved, so the evidence view's own
      // loading flag needs to catch up with reality. See CHANGES.MD / Demo 3.
      markEvidenceDataLoaded();
      renderDashboard();
      populateAllDropdowns();
      if (state.currentPage === "evidence") renderEvidenceList();
    })
    .catch(function (err) {
      console.error("Failed to load evidence.json", err);
      alert("Evidence could not be loaded. Some views may be incomplete.");
    });
}

// Second .then()/.catch()/.finally() -> async/await conversion for
// Demo 9. try/catch/finally map onto it directly: the catch still only
// logs (doesn't rethrow), and finally still always runs hideLoadingStep()
// whether the fetch succeeded or failed. See CHANGES.MD.
async function loadTimelineData() {
  try {
    const res = await fetch("data/timeline.json");
    const data = await res.json();
    state.allTimeline = data;
    renderDashboard();
    if (state.currentPage === "timeline") renderTimeline();
    populateAllDropdowns();
  } catch (err) {
    console.log("timeline load error", err);
  } finally {
    hideLoadingStep();
  }
}

export function loadAllData() {
  showLoadingOverlay("Loading case file…");
  loadingStepsRemaining = 2;
  return loadCorePeopleAndLocations().then(function () {
    loadEvidenceData();
    loadTimelineData();
  });
}

function populateAllDropdowns() {
  populateEvidenceDropdowns();
  populateTimelineDropdowns();
  populateHypothesisDropdowns();
}
