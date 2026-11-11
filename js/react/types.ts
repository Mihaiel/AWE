// ---------------------------------------------------------------------
// REACT SHELL TYPES
// ---------------------------------------------------------------------
// Exercise 3, Demo 9. A union of exactly the 5 real views, the same set
// `handleHashChange()` validates against at runtime in the vanilla
// router (js/router.ts). Here it's enforced at compile time instead,
// see EXERCISE_3.md for why that's a meaningful difference, not just a
// stylistic one.
export type ViewName = "dashboard" | "evidence" | "people" | "timeline" | "workspace";
