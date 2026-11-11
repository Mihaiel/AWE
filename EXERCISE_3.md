# Exercise 3 — React Foundations & First Migration

This is the third exercise in Advanced Web Engineering Course (CSDC). It builds on Exercises 1 and 2. This exercise adds
React to that project and migrates the **application shell and one representative view (the Dashboard)** to it. The rest of the app stays vanilla TS for now. You'll migrate more of it in Exercises 4 and 5.

Keep a running note of what you changed and why, and commit as you go. Several theory questions ask you to point at a specific decision or diff you made.

## Corresponding manuscript reading

This exercise corresponds to the following chapters in the course manuscript:

- **Chapter 12, From Static Documents to Rich Web Applications** — PDF pp. 85–88
- **Chapter 13, Rendering and Navigation Architectures** — PDF pp. 90–95
- **Chapter 14, Hybrid Rendering and Modern Web Architectures** — PDF pp. 96–100
- **Chapter 15, React Foundations** — PDF pp. 102–109

## Self-Check

The exercise is organized into 10 individual tasks with corresponding questions, that are
presented in class. 

These checkboxes are for self-checking. Don't forget to do the actual checking of tasks you are able to present in the Moodle course. **Before class, tick only what you can genuinely demonstrate or answer on the spot, live.**

| # | Demo | Ready? |
|---|---|---|
| 1 | Historical view of the web | ☐ |
| 2 | SSR vs. CSR | ☐ |
| 3 | The virtual DOM | ☐ |
| 4 | SPA vs. MPA: state & routing | ☐ |
| 5 | React introduction | ☐ |
| 6 | React + TypeScript entry point in the Vite project | ☐ |
| 7 | Component hierarchy for the whole app | ☐ |
| 8 | Architecture Decision Record: why SPA/React | ☐ |
| 9 | Migrate the application shell | ☐ |
| 10 | Migrate the Dashboard view | ☐ |

A demo only counts as "Ready" once **every** task and question checkbox inside it (below) is
ticked — the table above is just a fast overview, tick the boxes inside each demo first.

---

## Demo 1 — Historical view of the web

**Tasks**

- [x] Give a concise explanation of how web applications evolved over the years and place the app from the exercises on the timeline. Justify where you put it.

      Web apps went: static HTML pages (90s, full reload every click) -> server-generated dynamic pages (PHP/ASP, still full reloads) → AJAX/jQuery pages that fetched data and patched parts of the DOM without reloading (mid-2000s) -> full SPA frameworks that moved all rendering/state/routing to the client (React/Angular/Vue, 2010s+). This app sits right in that AJAX/jQuery stage: it fetches JSON and hand-rolls hash routing/DOM updates with no framework, exactly the pattern SPA frameworks were later built to formalize.

**Questions** (depend on the tasks above)

- [x] What specific problem was AJAX (and libraries like jQuery) solving that plain server-rendered pages couldn't? What new problems did that approach introduce, that SPA frameworks then tried to solve?

      AJAX let a page update small pieces of itself from the server without a full reload. It introduced the mess of manually tracking state and DOM updates by hand across a growing pile of jQuery callbacks, exactly the mess SPA frameworks exist to organize.

- [x] This app currently uses hash-based routing (`#dashboard`, `#evidence`, ...) with no full page reload between views. Which era does that pattern belong to, and what does it tell you about when this architectural choice became common?

      That's a classic pre-framework/early-SPA pattern from the AJAX/jQuery era (roughly 2005–2012). It shows this app already behaves like an SPA on its own, even before adopting an actual framework like React.

---

## Demo 2 — SSR vs. CSR

**Tasks**

- [x] Present a short comparison table for Server-Side Rendering and Client-Side Rendering. Explain what the server sends on first request, what the browser has to do before the user sees content, and what happens on subsequent navigation.

      With SSR, the server sends a fully rendered HTML page containing the actual content, so the browser can display it almost immediately. With CSR the browser first loads an almost-empty HTML shell and JavaScript bundle, then fetches the data and renders the content.

- [x] Pick one real, publicly known website and argue whether it's (primarily) SSR or CSR, using observable evidence (view source, network tab, etc.).

      Wikipedia. `curl -s https://de.wikipedia.org/wiki/Hauptkomponentenanalyse` (no JS execution at all) already returns the full article text in the raw HTML.

**Questions** (depend on the tasks above)

- [x] Explain why this exercise application is SSR or CSR and why. Walk through, step by step, what happens between the browser requesting the page and the Dashboard actually being visible.

      CSR. In index.html:137's `#dashboardContent` div is literally empty in the raw markup (just a comment, "rendered by js/views/dashboard.js"). Step by step: 1) server sends that near-empty `index.html` + the JS bundle, 2) the browser downloads and runs the bundle, 3) `dataLoader.ts` fetches `data/*.json`, 4) once that resolves, `renderDashboard()` builds the actual HTML and injects it. The Dashboard is only visible after all four of those steps, not after step 1.

- [x] Name one real cost of what the architecture pays for that choice (think about what a user with JavaScript disabled, or a slow connection, or a search engine crawler would see) and why.

      A user with JavaScript disabled, or a search engine crawler that doesn't execute JS, sees a blank page, no case summary, no evidence, nothing, because every bit of real content only exists after client-side JS runs and fetches it.

---

## Demo 3 — The virtual DOM

**Tasks**

- [x] In your own words (a few sentences, not a copied definition), explain what the virtual DOM is and what problem it solves.

      The virtual doom is light in-memory copy of what the DOM should look like. Instead of mutating the real DOM directly on every change, the library builds a new virtual copy, compares it to the previous one, and only applies the specific real-DOM changes needed. It solves the "rewriting far more of the page than actually changed" problem. Also innerHTML rebuilds do this and it's bad.

- [x] Find one concrete example in the *original* vanilla `app.js` (from before Exercise 1) where a small state change (e.g. toggling one bookmark) caused a large chunk of real DOM to be recreated via `innerHTML`, even though only a tiny part of it actually needed to change.

      Found in the pre-Exercise-1 `app.js` (deleted in commit `95d915a`, viewable via `git show 22cb2d8:app.js`). `handleBookmarkClick()` flips one evidence item's `bookmarked` flag, then calls `renderEvidenceList()`, which loops over *every* filtered evidence item, rebuilds each one's full card HTML, and does one `container.innerHTML = html`. Toggling a single ★ destroys and recreates all 18 evidence cards' real DOM nodes, not just the one card whose icon actually changed.

**Questions** (depend on the tasks above)

- [x] Using the example you found: how would a virtual-DOM-based approach (conceptually, not necessarily React-specific) avoid recreating the parts that didn't change?

      It would diff the new virtual tree (17 unchanged cards + 1 changed icon/class) against the previous one, see that 17 cards are identical, and only touch the real DOM for that one card's icon and class, leaving the other 17 real DOM nodes completely untouched.

- [x] Is the virtual DOM a "faster" way to update the real DOM than directly calling `innerHTML`? Explain precisely what's actually being traded off (think about the diffing work itself).

      Not in that sense, but it's actually more work in one sense: building a new virtual tree and diffing it against the old one is extra JS computation `innerHTML` never does. The trade is extra cheap JS-side diffing in exchange for far less expensive real-DOM mutation (DOM writes trigger layout/style recalculation; comparing two JS objects doesn't), so it wins specifically when the DOM subtree being touched is large and the actual change is small.

- [x] Does using a virtual DOM library automatically make your app fast? What could still make a React app slow despite it?

      No. It only guarantees that whatever gets re-rendered is applied to the real DOM efficiently, it says nothing about how often or how much re-renders in the first place. A React app can be slow from components re-rendering too often.

---

## Demo 4 — SPA vs. MPA: state & routing

**Tasks**

- [x] Diagram or illustrate live how navigation currently works in this app: what triggers a view change, what code runs, and what does *not* happen (that would happen in a classic multi-page site).

      Click nav button -> `navigateTo(viewName)` ([js/router.ts:16](js/router.ts:16)) sets `window.location.hash` -> the `hashchange` event fires -> `handleHashChange()` ([js/router.ts:21](js/router.ts:21)) reads the hash, toggles `.active` on the matching `.view` section and nav button, and calls that view's render function (only on its first visit, tracked by `state.viewRendered`). 
      
      What does not happen: no request to the server, no full page reload, no `<script>` tags re-running, nothing lost from memory, the whole thing is one DOM already sitting in the browser, just a different `<section>` getting shown.

- [x] List every piece of state in the current app that would be lost on a full page reload, versus what's preserved (hint: check what's in `localStorage` versus what's only in memory).

      Lost (in-memory only): `allEvidence`/`allPeople`/`allLocations`/`allTimeline`/`caseData` ([js/state.ts](js/state.ts)), though they're trivially refetched from the same `data/*.json` on reload; and the `viewRendered` flags, harmlessly, each view's first-visit render just runs again.

      Preserved: the current view, it lives in the URL's `#hash`, not in JS memory; and bookmarks (`remotion_bookmarks`), notes (`remotion_notes`), and the hypothesis draft (`remotion_hypothesis`), all three explicitly written to `localStorage` (localstorage.js)

      Also lost: the current search term, filter dropdowns, and sort order in the Evidence view, these only ever live as live DOM form-field values, never saved anywhere.

**Questions** (depend on the tasks above)

- [x] In a traditional multi-page app, where does "the current page's data" live between requests? Where does it live in this SPA instead, and what are the consequences of that difference (for good and for bad)?

      In an MPA it lives in the HTML the server just sent for that one request, nothing carries over in JS memory between pages, each navigation tears down and rebuilds everything from scratch. Here it lives in one JS `state` object ([js/state.ts](js/state.ts)) that persists for the whole session. Good: instant navigation, no refetching, bookmarking in Evidence instantly shows up in Workspace with no round trip. Bad: a reload wipes all of it at once (not per-page), so anything not deliberately pushed to `localStorage` is just gone.

- [x] This app currently implements routing by hand (`handleHashChange()`, a `switch`-like chain of `if`s, and manually toggling CSS classes). What is a router library actually responsible for that this hand-rolled version does *not* handle?

      Parameterized/nested routes, this app has no URL for "evidence item E04's detail view" at all, `#evidence` always means the list, opening a specific item is pure in-memory state you can't deep-link, bookmark, or refresh into. A real router also handles 404/fallback routes declaratively, scroll restoration per route, and keeping multiple UI pieces (nav highlighting, breadcrumbs) in sync with one source of truth automatically, instead of two separate manual loops over `.view` sections and `.nav-btn` elements that have to be kept in sync by hand.

- [x] If the user hits the browser's back button right now, what happens in this app, and why?

      It switches back to the previous top-level view (Dashboard/Evidence/People/etc.) correctly. Setting `window.location.hash` always pushes a real browser-history entry, so back/forward naturally fires `hashchange` again and `handleHashChange()` re-runs. 
      
      What it can't do: go back to "the specific evidence item I had open," that state was never written to the URL in the first place, so the back button only ever knows about the 5 top-level views, not anything inside one of them.

---

## Demo 5 — React introduction

**Tasks**

- [x] Read enough of the React docs (or equivalent) to write, from scratch, a single tiny component (it can live in a throwaway sandbox, not necessarily this project yet) that renders a piece of static data as JSX. No state, no props even, just to prove you can write and reason about JSX.

      ```tsx
      ```

- [x] Identify, in your own words, what "component" means in React, and how it differs from a plain JavaScript function that happens to return an HTML string (which is essentially what several functions in the old `app.js` did, e.g. `renderEvidenceCardHTML()`).

      A component is a function whose return value React itself understands as "a description of UI," React decides when to call it, turns what it returns into real DOM, and re-calls it to figure out what changed. `renderEvidenceCardHTML()` just returns a plain string, nothing knows it's UI until something else explicitly shoves it into `innerHTML`, no framework is tracking it, deciding when to rerun it, or diffing its output.

**Questions** (depend on the tasks above)

- [x] What is JSX, actually? What does it compile to?

      JSX is markdown that looks like HTML and is used as a declarative approach to state how the UI should look like through code. Similar to the previous course which we had, where kotlin switched from the xml I think to the declarative approach.

- [x] Compare your tiny component to the old `renderEvidenceCardHTML(ev)` function (string concatenation returning an HTML string). What is fundamentally different about how each one's output becomes real DOM?

      `renderEvidenceCardHTML()` ([js/views/evidence.ts](js/views/evidence.ts)) returns a raw string, it only becomes DOM because something later calls `container.innerHTML = html`, which the browser's HTML parser turns into real nodes all at once, destructively, no memory of what was there before.
      
      My component returns a tree of React element objects. React's renderer walks that tree, diffs it against the previous one, and only touches the specific real DOM nodes that actually changed, nothing is ever reparsed as HTML text.

- [x] What does it mean that "components are just functions" in React? What would break if a component's function body had a side effect (e.g. mutated a global variable) every time it rendered?

      It means a component genuinely is just a function, React calls it and uses whatever it returns. React relies on that call being pure/predictable, it may call a component's body more than once for the same render (e.g. Strict Mode's intentional double-invoke in development) without that being visible anywhere. A side effect in the body (mutating a global) would fire an unpredictable number of times and make two renders with identical props produce different results depending on unrelated state.

---

## Demo 6 — React + TypeScript entry point in the Vite project

**Tasks**

- [ ] Add React and TypeScript support to the existing Vite project from Exercise 2 (the right Vite plugin, `tsx` support, React types).
- [ ] Create a minimal entry point (e.g. a root `<App />` component mounted into the page) that
renders *something* visible, without removing the working vanilla app yet.
- [ ] Decide and document how the two versions coexist during the migration (e.g. a separate route/ flag to view the React version, or a full swap-over. Your call, but be ready to justify it).

**Questions** (depend on the tasks above)

- [ ] What did you actually have to install and configure to get JSX compiling through Vite? What is each piece responsible for?
- [ ] How does your `<App />` component get from source code onto the actual page? Trace the path from your `.tsx` file to the DOM.
- [ ] What decision did you make about how the vanilla and React versions coexist during migration, and why? What would go wrong with an opposite choice?

---

## Demo 7 — Component hierarchy for the whole app

**Tasks**

- [ ] Design and diagram a proposed component hierarchy for the **entire application**, not just the part you're building this exercise. E.g. pages (one per current view) and the reusable components you expect to extract (cards, badges, buttons, form controls, etc.), even though most of them won't be built until Exercises 4 and 5.
- [ ] For at least 5 components in your diagram, briefly note what data/props each one would need and where that data comes from.

**Questions** (depend on the tasks above)

- [ ] What criteria did you use to decide something should be its own component versus staying inline inside a bigger one?
- [ ] Pick one component in your diagram that appears in more than one place in the app. What made you extract it instead of duplicating its markup, and how does that compare to how the original vanilla app handled (or didn't handle) that same duplication?
- [ ] Your diagram includes components you won't build until later exercises. Why is it useful to design the whole hierarchy now rather than only diagramming what you're about to build?

---

## Demo 8 — Architecture Decision Record: why SPA/React

**Tasks**

- [ ] Argue whether an SPA built with React is actually the right architecture for *this specific app*, given what it does.
- [ ] Include honest trade-offs or downsides of the SPA/React choice for this app, not just the benefits.

**Questions** (depend on the tasks above)

- [ ] What would you lose by keeping this app as server-rendered vanilla HTML/JS instead? What would you lose by choosing React specifically over a *different* SPA approach (e.g. vanilla JS with a router, or a lighter library)?
- [ ] If this app needed to support users on very low-end devices or poor connections as a hard requirement, would you stick with SPA or change the architecture? Why or why not?

---

## Demo 9 — Migrate the application shell

**Tasks**

- [ ] Build the header/branding, the navigation bar, and a routing skeleton (even a minimal one, a full router library is not required yet) in React + TypeScript.
- [ ] Wire it up so navigating between (stub) pages actually changes what's rendered, mirroring the current five views even though only the Dashboard will have real content this exercise.

**Questions** (depend on the tasks above)

- [ ] How does "the current view" get tracked in your React shell? Compare this directly to how `currentPage` and `handleHashChange()` did it in the vanilla version? What's actually
different, and what's superficially different but conceptually the same?
- [ ] What happens in your shell if a user navigates to a view that doesn't exist? How does that compare to the vanilla app's fallback-to-dashboard behavior?

---

## Demo 10 — Migrate the Dashboard view

**Tasks**

- [ ] Rebuild the Dashboard view as React components (using your hierarchy from Demo 7 as a starting point), rendering the case summary, stat cards, review progress, and the recent
evidence/timeline lists. Reading from the same data your app already loads.
- [ ] Confirm it renders correctly with real data, and that navigating away and back doesn't lose or corrupt anything.

**Questions** (depend on the tasks above)

- [ ] Where does the Dashboard's data (case info, evidence, timeline) come from in your React version, and how does it get to the components that render it? Is this the final architecture you intend to keep, or a placeholder you know you'll change in a later exercise?
- [ ] The old vanilla dashboard had a real bug where it could show stale numbers because it only re-rendered on a view's *first* visit (a manual render-cache flag). Does your React version have an equivalent risk? Why or why not, given how React re-renders?
- [ ] What, if anything, does your React Dashboard do differently from the vanilla one in terms of *when* it recalculates derived values (like the review-progress percentage)?

---

## What to bring to class

For each of the 10 demos: your changed code/diagrams/documents (ideally as commits you can show live), and the ticked checkboxes above reflecting what you can genuinely demonstrate and answer *right now*.
