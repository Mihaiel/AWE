// ---------------------------------------------------------------------
// SHARED STATE
// ---------------------------------------------------------------------
// Everything here is touched by more than one module, so it lives as
// properties on one object instead of several separate exports - you
// can't reassign an imported binding, but mutating its properties is
// fine. State that only ever mattered to one view stayed local to that
// module instead, see CHANGES.MD for the reasoning behind each one.
export const state = {
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
    workspace: false
  },

  notesStore: {}
};
