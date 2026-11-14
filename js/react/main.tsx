// ---------------------------------------------------------------------
// REACT ENTRY POINT - mounts <App /> into #react-root
// ---------------------------------------------------------------------
// Exercise 4: only loaded by react.html now, its own standalone page, so
// no more opt-in flag or hidden-by-default div to un-hide; the page's
// existence is the opt-in.
import { createRoot } from "react-dom/client";
import App from "./App.js";

const root = document.getElementById("react-root");
if (root) {
  createRoot(root).render(<App />);
}
