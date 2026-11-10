// ---------------------------------------------------------------------
// TIMELINE VIEW
// ---------------------------------------------------------------------
import { state } from "../state.js";
import {
  findEvidenceById,
  findLocationById,
  formatDate,
  certaintyBadgeClass,
  optionHTML,
  getEl,
} from "../utils.js";
import { navigateTo } from "../router.js";
import { openEvidenceDetail } from "./evidence.js";
import type { TimelineEvent } from "../types.js";

// Only used inside openEvidenceModal below.
let modalCloseListenerCount = 0;

export function populateTimelineDropdowns(): void {
  const personSelect = document.getElementById("timelinePersonFilter") as HTMLSelectElement | null;
  const locationSelect = document.getElementById(
    "timelineLocationFilter",
  ) as HTMLSelectElement | null;
  const typeSelect = document.getElementById("timelineTypeFilter") as HTMLSelectElement | null;
  if (!personSelect || !locationSelect || !typeSelect) return;

  personSelect.innerHTML = optionHTML("", "All people");
  for (let p = 0; p < state.allPeople.length; p++) {
    personSelect.innerHTML += optionHTML(state.allPeople[p]!.id, state.allPeople[p]!.name);
  }

  locationSelect.innerHTML = optionHTML("", "All locations");
  for (let l = 0; l < state.allLocations.length; l++) {
    locationSelect.innerHTML += optionHTML(state.allLocations[l]!.id, state.allLocations[l]!.id);
  }

  const types: string[] = [];
  for (let i = 0; i < state.allTimeline.length; i++) {
    if (types.indexOf(state.allTimeline[i]!.type) === -1) types.push(state.allTimeline[i]!.type);
  }
  typeSelect.innerHTML = optionHTML("", "All event types");
  for (let t = 0; t < types.length; t++) {
    typeSelect.innerHTML += optionHTML(types[t]!, types[t]!);
  }
}

export function renderTimeline(): void {
  const container = document.getElementById("timelineContainer");
  if (!container) return;

  const order = getEl<HTMLSelectElement>("timelineOrder").value;
  const personFilter = getEl<HTMLSelectElement>("timelinePersonFilter").value;
  const locationFilter = getEl<HTMLSelectElement>("timelineLocationFilter").value;
  const typeFilter = getEl<HTMLSelectElement>("timelineTypeFilter").value;

  // let, not const: reassigned below once it's sorted.
  let events: TimelineEvent[] = [];
  for (let i = 0; i < state.allTimeline.length; i++) {
    const evt = state.allTimeline[i]!;
    if (personFilter && evt.personIds.indexOf(personFilter) === -1) continue;
    if (locationFilter && evt.locationIds.indexOf(locationFilter) === -1) continue;
    if (typeFilter && evt.type !== typeFilter) continue;
    events.push(evt);
  }

  events = events.slice().sort(function (a, b) {
    const diff = new Date(a.time).getTime() - new Date(b.time).getTime();
    return order === "desc" ? -diff : diff;
  });

  let html = "";
  for (let e = 0; e < events.length; e++) {
    const item = events[e]!;
    html += '<div class="timeline-event certainty-' + item.certainty + '">';
    html +=
      '<div class="timeline-time">' +
      formatDate(item.time) +
      '&nbsp;&middot;&nbsp;<span class="badge badge-' +
      certaintyBadgeClass(item.certainty) +
      '">' +
      item.certainty +
      "</span></div>";
    html += "<h3>" + item.title + "</h3>";
    html += "<p>" + item.description + "</p>";

    const eventLocationNames: string[] = [];
    for (let el = 0; el < item.locationIds.length; el++) {
      const evtLoc = findLocationById(item.locationIds[el]!);
      // evtLoc is an object (id, name, ...) - push its name, not the
      // object itself, or this renders as "[object Object]". Demo 5.
      eventLocationNames.push(evtLoc ? evtLoc.id + " - " + evtLoc.name : item.locationIds[el]!);
    }
    if (eventLocationNames.length > 0) {
      html += '<p class="evidence-meta">Location: ' + eventLocationNames.join(", ") + "</p>";
    }

    for (let ev2 = 0; ev2 < item.evidenceIds.length; ev2++) {
      html +=
        '<button type="button" class="evidence-link-btn" data-evidence-id="' +
        item.evidenceIds[ev2] +
        '">View ' +
        item.evidenceIds[ev2] +
        "</button>";
    }
    html += "</div>";
  }
  if (events.length === 0) {
    html = "<p>No timeline events match the current filters.</p>";
  }
  container.innerHTML = html;

  const linkButtons = container.querySelectorAll(".evidence-link-btn");
  for (let b = 0; b < linkButtons.length; b++) {
    linkButtons[b]!.addEventListener("click", function (e) {
      openEvidenceModal((e.target as HTMLElement).getAttribute("data-evidence-id")!);
    });
  }
}

// --- Quick-view modal (used from the timeline) -------------------------
function openEvidenceModal(evidenceId: string): void {
  const ev = findEvidenceById(evidenceId);
  if (!ev) return;

  // let, not const: reassigned just below if the modal doesn't exist yet.
  let modal = document.getElementById("quickViewModal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "quickViewModal";
    document.body.appendChild(modal);
  }

  modal.innerHTML =
    '<div class="modal-backdrop"><div class="modal-box">' +
    '<button type="button" class="modal-close-btn" aria-label="Close">&times;</button>' +
    "<h3>" +
    ev.title +
    "</h3>" +
    '<p class="evidence-meta">' +
    ev.id +
    " &middot; " +
    ev.type +
    " &middot; " +
    formatDate(ev.timestamp) +
    "</p>" +
    "<p>" +
    ev.summary +
    "</p>" +
    '<button type="button" class="btn btn-primary btn-small" data-open-full="' +
    ev.id +
    '">Open full evidence</button>' +
    "</div></div>";

  modalCloseListenerCount++;
  console.log("modal opened, active close listeners:", modalCloseListenerCount);

  modal.addEventListener("click", function (e) {
    const target = e.target as HTMLElement;
    if (
      target.classList.contains("modal-close-btn") ||
      target.classList.contains("modal-backdrop")
    ) {
      modal.innerHTML = "";
    }
    if (target.getAttribute && target.getAttribute("data-open-full")) {
      modal.innerHTML = "";
      navigateTo("evidence");
      setTimeout(function () {
        openEvidenceDetail(target.getAttribute("data-open-full")!);
      }, 0);
    }
  });
}
