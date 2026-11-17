# Project ReMotion – Investigation Portal

Investigate the failure of an AI-assisted rehabilitation robot.

## About

Project ReMotion is a browser-based investigation platform built around a fictional incident.
During a pre-demonstration calibration test, the AI-assisted rehabilitation robot **ReMotion**
loaded the wrong calibration profile and triggered its emergency stop. This application lets an
investigator review the evidence, people, locations, and timeline surrounding the incident, and
build up a working hypothesis about what happened.

This repository contains an existing vanilla-JavaScript (no frameworks used) investigation application. The system is
functional but has accumulated technical debt and inconsistent implementation decisions. Your task
during the course will be to analyse, maintain, refactor, migrate, and extend it.

## Running the application

This application uses `fetch()` to load its case data from local JSON files, so it must be served
over HTTP — opening `index.html` directly from the filesystem (`file://`) will not work in most
browsers.

Any static file server will do. For example, from the project root:

```bash
# Python 3
python -m http.server 8080

# Node.js (no install required)
npx serve .

# VS Code
# Use the "Live Server" extension
```

Then open `http://localhost:8080` (or whatever port your server prints) in your browser.

### React version (Vite)

The React rewrite (`react.html`) is built with Vite. From the project root:

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL with `/AWE/react.html` appended, e.g.
`http://localhost:5173/AWE/react.html`.

## Dev-only backend (Exercise 6)

Starting with Exercise 6, the React views can read the case data from a small local Node/Express
server instead of the static `data/*.json` files, specifically to make loading states, errors, and
request races possible to demonstrate (a static file is either instant or a 404 — never slow,
never intermittently failing).

**This backend is dev-only.** It is never built, bundled, or deployed — it is not part of the
Exercise 2 GitHub Pages workflow, which only ever builds and deploys the static frontend
(`dist/`). Running it locally has no effect on what gets deployed.

Run it alongside `npm run dev`, in a second terminal:

```bash
npm run server
```

This starts an Express server at `http://localhost:3001` with one read-only `GET` endpoint per
data resource, each returning the exact same JSON the corresponding `public/data/*.json` file
already does:

- `GET /api/case`
- `GET /api/evidence`
- `GET /api/people`
- `GET /api/locations`
- `GET /api/timeline`

There are no write endpoints and nothing is persisted server-side — bookmarks, notes, and the
hypothesis draft all continue to live in the browser's `localStorage`, exactly as before.

Two query parameters, supported on every endpoint above, exist purely to simulate real-world
network conditions for testing later demos (loading states, errors, request cancellation):

- `?delay=<ms>` — waits the given number of milliseconds before responding. For example,
  `http://localhost:3001/api/evidence?delay=3000` takes about 3 seconds to respond.
- `?error=1` (or `?error=true`) — responds with a `500` and a JSON error body instead of the real
  data, on demand. For example, `http://localhost:3001/api/evidence?error=1`.

Both default to off; a plain request (no query params) behaves like a normal, fast, successful
fetch.

## Features

- **Dashboard** — case summary and key statistics calculated from the loaded case data.
- **Evidence catalogue** — search, filter (by type, person, location, status, relevance), sort,
  bookmark, and open detailed evidence records.
- **People & Locations** — profile cards for the investigation team and the six key locations.
- **Timeline** — chronological view of case events with filtering and links to related evidence.
- **Investigator workspace** — bookmarked evidence, personal notes, and a hypothesis draft form.
  Workspace data is saved to your browser's local storage and will still be there when you reload
  the page.

## Browser requirements

A recent version of any evergreen desktop browser (Chrome, Firefox, Edge, Safari). JavaScript must
be enabled. The layout targets common desktop and tablet widths.

## Project status

This is an existing brownfield application, not a fresh scaffold. It works for everyday use, but
you should expect to find rough edges, inconsistent patterns, and a handful of bugs as you work
with it — that discovery process is part of the course.
