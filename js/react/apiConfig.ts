// ---------------------------------------------------------------------
// BACKEND BASE URL - Exercise 6, Demo 5
// ---------------------------------------------------------------------
// One shared constant instead of hand-typing this literal in every
// fetch() call across the 5 views. Deliberately NOT the "API-access
// layer" Demo 9 asks for - that also owns endpoint paths, response
// shapes, and is used through a custom hook, not called directly from
// components (which is still exactly what every view below does, on
// purpose, until Demo 8/9 build that). This is just avoiding the same
// magic string duplicated 6 times.
export const API_BASE_URL = "http://localhost:3001";
