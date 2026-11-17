// ---------------------------------------------------------------------
// REACT ENTRY POINT - mounts <App /> into #react-root
// ---------------------------------------------------------------------
// Exercise 4: only loaded by react.html now, its own standalone page, so
// no more opt-in flag or hidden-by-default div to un-hide; the page's
// existence is the opt-in.
//
// Exercise 6, Demo 1: wrapped in StrictMode. In development only, this
// makes React call every component's render function (and, relevant
// for Demo 2/3 later, mount every effect) twice in a row per actual
// commit, specifically to surface code that silently assumes "this
// only runs once" - exactly the side-effect-in-render problem this
// demo is about. It's a no-op in production builds (confirmed via
// `npm run build && npm run preview`: no double-render there). See
// EXERCISE_6.md Demo 1 and RenderSideEffectThrowaway.tsx for a visible
// demonstration.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.js";

const root = document.getElementById("react-root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
