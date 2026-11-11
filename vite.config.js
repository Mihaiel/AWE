// Exercise 2, Demo 2. Defaults already match this project's layout -
// index.html at the project root, public/ for data/*.json and assets/*
// that get fetched by URL at runtime instead of imported, so they're
// served as-is in dev and copied as-is into dist/ on build. Kept as an
// explicit (if currently empty) config file rather than skipping it,
// so later demos (e.g. a GitHub Pages base path) have an obvious place
// to add to instead of introducing the file from scratch mid-exercise.
//
// Exercise 2, Demo 9: GitHub Pages serves a repo (not a user/org) site
// under /<repo-name>/, not at the domain root, so the built index.html's
// own asset references (the <script>/<link> tags Vite rewrites) need
// that prefix or they'd 404 once deployed. Doesn't affect the fetch()
// calls to data/*.json or the public/assets/ image reference in
// index.html, both stay plain relative paths Vite never touches, and
// the browser resolves those against the page's own URL regardless.
//
// Exercise 3, Demo 6: @vitejs/plugin-react is what actually transforms
// JSX in .tsx files into plain JS (via esbuild/Babel under the hood) and
// wires up React Fast Refresh for the dev server. Without this plugin,
// Vite has no idea what to do with a `<div>` inside a .tsx file at all.
import react from "@vitejs/plugin-react";

export default {
  base: "/AWE/",
  plugins: [react()],
};
