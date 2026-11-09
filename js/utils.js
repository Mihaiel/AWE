// ---------------------------------------------------------------------
// GENERIC LOOKUP + FORMATTING HELPERS
// ---------------------------------------------------------------------
// Small helpers a few different views need. The lookups still read
// from shared state, they just don't belong to any one view.
import { state } from "./state.js";

export function findEvidenceById(id) {
  for (let i = 0; i < state.allEvidence.length; i++) {
    if (state.allEvidence[i].id === id) return state.allEvidence[i];
  }
  return null;
}

export function findPersonById(id) {
  for (let i = 0; i < state.allPeople.length; i++) {
    if (state.allPeople[i].id === id) return state.allPeople[i];
  }
  return null;
}

export function findLocationById(id) {
  for (let i = 0; i < state.allLocations.length; i++) {
    if (state.allLocations[i].id === id) return state.allLocations[i];
  }
  return null;
}

export function evidenceMentionsPerson(ev, person) {
  if (!ev.personIds) return false;
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
}

export function formatDate(ts) {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " + d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function getStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
}

export function getRelevanceBadgeClass(relevance) {
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-unreviewed";
}

export function certaintyBadgeClass(certainty) {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
}

// Code smell fix, Demo 8: this exact "<option value=...>label</option>"
// string got hand-built the same way in evidence.js, timeline.js and
// workspace.js (8 times total) instead of going through one shared
// helper - any future change to the markup would've meant finding and
// fixing all 8 copies. Output is byte-for-byte identical to before.
export function optionHTML(value, label) {
  return '<option value="' + value + '">' + label + "</option>";
}
