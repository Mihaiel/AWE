// ---------------------------------------------------------------------
// DEV-ONLY READ-ONLY BACKEND - Exercise 6, Demo 4
// ---------------------------------------------------------------------
// See README.md's "Dev-only backend" section for how this runs
// alongside `npm run dev` and why it exists. Scope, deliberately kept
// small per EXERCISE_6.md's own framing: one read-only GET endpoint
// per data/*.json file, nothing more - no write endpoints, no
// persistence, no auth. Bookmarks, notes, and the hypothesis draft all
// stay exactly where they already are, localStorage, completely
// untouched by this.
//
// Never built, bundled, or deployed: vite.config.js's build.rollupOptions
// never references this directory, this file isn't under tsconfig.json's
// `include` (plain .js, not .ts/.tsx), and Exercise 2's GitHub Pages
// workflow only ever builds/deploys dist/ - the static frontend alone.
// `npm run server` (added to package.json) starts this manually,
// separately from `npm run dev`.
import express from "express";
import cors from "cors";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Reads the exact same files the static frontend already fetches from
// public/data/ - one source of JSON, not a second copy that could
// drift out of sync with it.
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();

// Exercise 6, Demo 4's own question: the frontend (Vite's dev server,
// localhost:5173) and this backend (localhost:3001) are different
// origins by the browser's definition - same host, different port
// still counts. Without this, the browser's CORS policy would block
// the frontend's fetch() responses before any application code ever
// saw them. cors() with no options reflects the request's own Origin
// header back, which is fine for a backend that's dev-only, read-only,
// and never deployed - not a pattern to copy as-is onto a real,
// deployed API.
app.use(cors());

// --- artificial delay/error controls (Demo 4 task 2) ------------------
// Every endpoint below supports both, not just one: ?delay=<ms> waits
// before responding, ?error=1 (or ?error=true) responds with a 500
// instead of the real data. Both are optional, off by default, so
// ordinary requests - and anything Demo 5 builds against this - are
// unaffected unless a later demo's test deliberately asks for them.
function delayMsFromQuery(req) {
  const ms = Number(req.query.delay);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

function wantsSimulatedError(req) {
  return req.query.error === "1" || req.query.error === "true";
}

async function sendJsonFile(req, res, filename) {
  // Exercise 6, Demo 7: delay used to be checked after the error
  // check, so `?delay=3000&error=1` returned instantly instead of
  // waiting - found live while trying to construct a request race
  // that needed a request to be both slow AND ultimately fail.
  // Confirmed via `curl -s -o /dev/null -w ... ?delay=3000&error=1`
  // before this fix: 0.023s total, not ~3s. Delay now always applies
  // first, regardless of whether an error is also requested.
  const delayMs = delayMsFromQuery(req);
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  if (wantsSimulatedError(req)) {
    res.status(500).json({ error: `Simulated failure loading ${filename}` });
    return;
  }

  try {
    // Sent as-is, not re-parsed/re-serialized through JSON.parse/
    // res.json() - guarantees byte-for-byte the same shape the static
    // data/*.json file already has, no risk of formatting drift.
    const raw = await readFile(path.join(DATA_DIR, filename), "utf-8");
    res.type("application/json").send(raw);
  } catch (err) {
    res.status(500).json({ error: `Could not read ${filename}`, detail: String(err) });
  }
}

app.get("/api/case", (req, res) => sendJsonFile(req, res, "case.json"));
app.get("/api/evidence", (req, res) => sendJsonFile(req, res, "evidence.json"));
app.get("/api/people", (req, res) => sendJsonFile(req, res, "people.json"));
app.get("/api/locations", (req, res) => sendJsonFile(req, res, "locations.json"));
app.get("/api/timeline", (req, res) => sendJsonFile(req, res, "timeline.json"));

app.listen(PORT, () => {
  console.log(`Dev-only backend listening on http://localhost:${PORT}`);
});
