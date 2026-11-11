// ---------------------------------------------------------------------
// GENERIC LOOKUP + FORMATTING HELPERS
// ---------------------------------------------------------------------
// Small helpers a few different views need. The lookups still read
// from shared state, they just don't belong to any one view.
import { state } from "./state.js";
import type { Evidence, Person, Location } from "./types.js";


// Rewritten from an indexed for-loop to .find(), Exercise 2 Demo 5:
// with noUncheckedIndexedAccess on, state.allEvidence[i] types as
// `T | undefined` (TS can't prove i is in bounds), which the old
// loop never accounted for. .find() already returns `T | undefined`
// by design, so this is the actually-correct version, not just a
// type-checker-pleasing patch.
export function findEvidenceById(id: string): Evidence | null {
  return state.allEvidence.find((item) => item.id === id) ?? null;
}

export function findPersonById(id: string): Person | null {
  return state.allPeople.find((item) => item.id === id) ?? null;
}

export function findLocationById(id: string): Location | null {
  return state.allLocations.find((item) => item.id === id) ?? null;
}

// Checks both person.id and person.name because evidence.json's
// personIds isn't reliably one or the other - see types.ts's Evidence
// comment. This dual check already existed before Demo 6; the real
// Evidence/Person types just make the reason explicit instead of
// implicit. Exercise 2, Demo 6.
export function evidenceMentionsPerson(ev: Evidence, person: Person): boolean {
  return ev.personIds.indexOf(person.id) !== -1 || ev.personIds.indexOf(person.name) !== -1;
}

// document.getElementById() types as HTMLElement | null, which strict
// null checks won't let callers treat as just HTMLElement. Every id this
// app looks up is one hardcoded, always-rendered element in index.html,
// so a missing one is a markup bug, not a case to handle gracefully -
// this throws instead of letting every call site repeat the same null
// check. The generic lets a call site narrow straight to the subtype it
// needs (e.g. getEl<HTMLInputElement>(...)) instead of casting after.
// Exercise 2, Demo 7.
export function getEl<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Expected element #${id} to exist`);
  return el as T;
}

export function formatDate(ts: string | undefined): string {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  return (
    d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) +
    " " +
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })
  );
}

export function getStatusBadgeClass(status: string | undefined): string {
  const s = (status || "").toLowerCase();
  if (s === "reviewed") return "badge-reviewed";
  if (s === "flagged") return "badge-flagged";
  return "badge-unreviewed";
}

export function getRelevanceBadgeClass(relevance: string | undefined): string {
  const r = (relevance || "").toLowerCase();
  if (r === "relevant") return "badge-relevant";
  return "badge-unreviewed";
}

// Arrow function, Demo 10: same reasoning as optionHTML below - pure,
// no `this`/`arguments`, nothing calls it before the module finishes
// loading. Uses a block body (not a single-expression arrow) since it
// has several early returns instead of one expression to hand back.
export const certaintyBadgeClass = (certainty: string | undefined): string => {
  if (certainty === "confirmed") return "reviewed";
  if (certainty === "contradictory") return "critical";
  if (certainty === "reported") return "flagged";
  return "unreviewed";
};

// Code smell fix, Demo 8: this exact "<option value=...>label</option>"
// string got hand-built the same way in evidence.js, timeline.js and
// workspace.js (8 times total) instead of going through one shared
// helper - any future change to the markup would've meant finding and
// fixing all 8 copies. Output is byte-for-byte identical to before.
// Arrow function, Demo 10: single expression, so this one gets an
// implicit return instead of a block body + explicit `return`.
export const optionHTML = (value: string, label: string): string =>
  '<option value="' + value + '">' + label + "</option>";
