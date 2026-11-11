// ---------------------------------------------------------------------
// SHARED STATE
// ---------------------------------------------------------------------
// Everything here is touched by more than one module, so it lives as
// properties on one object instead of several separate exports - you
// can't reassign an imported binding, but mutating its properties is
// fine. State that only ever mattered to one view stayed local to that
// module instead, see CHANGES.MD for the reasoning behind each one.

// Exercise 2, Demo 6: now using the real Evidence/Person/Location/
// TimelineEvent shapes from types.ts, replacing Demo 5's placeholder
// HasId[] arrays.
import type { Case, Person, Location, Evidence, TimelineEvent } from "./types.js";

interface ViewRendered {
  dashboard: boolean;
  evidence: boolean;
  people: boolean;
  timeline: boolean;
  workspace: boolean;
}

interface AppState {
  allEvidence: Evidence[];
  filteredEvidence: Evidence[];
  bookmarks: string[];
  currentPage: string;

  allPeople: Person[];
  allLocations: Location[];
  allTimeline: TimelineEvent[];
  // Empty object until case.json loads; Partial<Case> says every field
  // may still be missing instead of claiming the full Case shape early.
  caseData: Partial<Case>;

  viewRendered: ViewRendered;

  notesStore: Record<string, string>;
}

export const state: AppState = {
  allEvidence: [],
  filteredEvidence: [],
  bookmarks: [],
  currentPage: "dashboard",

  allPeople: [],
  allLocations: [],
  allTimeline: [],
  caseData: {},

  viewRendered: {
    dashboard: false,
    evidence: false,
    people: false,
    timeline: false,
    workspace: false,
  },

  notesStore: {},
};
