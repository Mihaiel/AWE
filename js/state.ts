// ---------------------------------------------------------------------
// SHARED STATE
// ---------------------------------------------------------------------
// Everything here is touched by more than one module, so it lives as
// properties on one object instead of several separate exports - you
// can't reassign an imported binding, but mutating its properties is
// fine. State that only ever mattered to one view stayed local to that
// module instead, see CHANGES.MD for the reasoning behind each one.

// Exercise 2, Demo 5: deliberately NOT modeling the real Evidence/Person/
// Location/TimelineEvent shapes yet, that's Demo 6's job. This is the
// minimal honest thing every record this app looks up by id actually
// has, nothing more, so it can stay accurate without guessing ahead.
export interface HasId {
  id: string;
}

interface CaseData {
  title?: string;
  status?: string;
  summary?: string;
}

interface ViewRendered {
  dashboard: boolean;
  evidence: boolean;
  people: boolean;
  timeline: boolean;
  workspace: boolean;
}

interface AppState {
  allEvidence: HasId[];
  filteredEvidence: HasId[];
  bookmarks: string[];
  currentPage: string;

  allPeople: HasId[];
  allLocations: HasId[];
  allTimeline: HasId[];
  caseData: CaseData;

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
