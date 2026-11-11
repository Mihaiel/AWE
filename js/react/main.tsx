// ---------------------------------------------------------------------
// REACT ENTRY POINT - mounts <App /> into #react-root
// ---------------------------------------------------------------------
import { createRoot } from "react-dom/client";
import App from "./App.js";

// import.meta.env.DEV is only true while running `npm run dev`; Vite
// replaces it with the literal `false` in a production build, so this
// whole block gets dead-code-eliminated out of what actually ships to
// GitHub Pages. The ?react flag on top keeps it opt-in during dev too,
// without it the placeholder would show on every local dev visit.
const showReactShell =
  import.meta.env.DEV && new URLSearchParams(window.location.search).has("react");

if (showReactShell) {
  const root = document.getElementById("react-root");
  if (root) {
    root.classList.remove("hidden");
    createRoot(root).render(<App />);
  }
}
