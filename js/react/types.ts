// ---------------------------------------------------------------------
// REACT SHELL TYPES
// ---------------------------------------------------------------------
// Exercise 3, Demo 9 had a `ViewName` union here (the same 5 views
// `handleHashChange()` validates against at runtime in js/router.ts),
// enforced at compile time instead of at runtime. Exercise 4, Demo 8
// replaced that whole state-based view switch with react-router routes
// (see App.tsx), so there's no "current view" value left to type - the
// URL itself is the source of truth now. Left as an explicit (if
// currently empty) module rather than deleted, same reasoning as
// vite.config.js's own comment: an obvious place for shared react/
// types to land again later rather than introducing the file from
// scratch.
export {};
