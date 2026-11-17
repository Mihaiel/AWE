# Exercise 6 — Effects, Data Fetching & a Backend

This is the sixth exercise in Advanced Web Engineering Course (CSDC). It builds on Exercises 3–5. All 5 views should already be fully working in React, reading their data from the static `data/*.json` files. This exercise replaces those static files with a small **Node.js backend**, and uses that to properly teach effects, loading/error/empty states, and request cancellation. Things that are hard to demonstrate convincingly against files that can only ever be "instant" or
"404."

**Scope of the backend, deliberately kept small:** a minimal Node server (Express or equivalent) that serves the same 5 JSON files as **read-only** REST endpoints. No write endpoints, no persistence. Bookmarks, notes, and the hypothesis draft stay in `localStorage` exactly as before. Only *reading* the case data moves to the network. **The backend runs locally in development only, it is not deployed.** Exercise 2's GitHub Pages workflow still builds and deploys the static frontend. Wiring up a real deployed backend is out of scope here.


## Corresponding manuscript reading

The closest corresponding sections in the course manuscript:

- **Chapter 6, Promises, `async`/`await`, and Error Flow** — especially error handling, cleanup, cancellation, and relevance, PDF pp. 47–52
- **Chapter 13, Rendering and Navigation Architectures** — “SPA communication flow” and “State in long-lived applications,” PDF pp. 91–93
- **Chapter 15, React Foundations** — “Function components and purity” and “React owns its root DOM,” PDF pp. 104 and 108
- **Chapter 16, React Component Design and Routing** — “Conditional rendering,” PDF p. 110


## Self-Check

The exercise is organized into 10 individual tasks with corresponding questions, that are
presented in class.
These checkboxes are for self-checking. Don't forget to do the actual checking of tasks you are able to present in the Moodle course. **Before class, tick only what you can genuinely demonstrate or answer on the spot, live.**

| # | Demo | Ready? |
|---|---|---|
| 1 | Render logic vs. effects | ☐ |
| 2 | `useEffect` mental model & dependency arrays | ☐ |
| 3 | Cleanup: timers & subscriptions | ☐ |
| 4 | Build the read-only Node backend | ☐ |
| 5 | Consume the backend from React | ☐ |
| 6 | Loading, error, and empty states | ☐ |
| 7 | Request races & cancellation | ☐ |
| 8 | Extract a reusable custom hook | ☐ |
| 9 | Separate UI, application logic, and API access | ☐ |
| 10 | Data-flow wrap-up & a written UX decision | ☐ |
---

## Demo 1 — Render logic vs. effects

**Tasks**

- [x] Find (or deliberately write, then remove) an example of a **side effect performed directly during a component's render**. For example, mutating a variable outside the component, calling `console.log` for debugging on every render, or reading `localStorage` inline in the function body instead of in an effect, and explain why it's a side effect even though it "seems to work."

    Inside /AWE/react.html

  [WorkspacePage.tsx](js/react/workspace/WorkspacePage.tsx) used to call `const notes = readNotes();` directly in the render body — reading `localStorage` fresh every single render, not inside an effect or a lazy initializer. 
  
  It "worked" because this app always remounts `WorkspacePage` fresh on navigation and `readNotes()` has no observable side effect of its own (it's a read). But it's still a side effect during render by definition: render is supposed to be a pure function of props/state, and reaching out to read a mutable external store (`localStorage`, which anything else on the page could change) breaks that — React is free to call this function body more than once per commit (confirmed below), and nothing here is guaranteed to happen exactly once.
  
    Fixed it: now `const [notes] = useState(readNotes);` ([WorkspacePage.tsx:111](js/react/workspace/WorkspacePage.tsx)) — the read only ever runs once, on mount, via `useState`'s lazy initializer, same pattern the `draft` state right above it already used.

  Also deliberately wrote a throwaway one to demonstrate live: [RenderSideEffectThrowaway.tsx](js/react/RenderSideEffectThrowaway.tsx), a module-level `renderCount` variable incremented directly in a component's render body. Kept in the repo commented out (both the import and the `<RenderSideEffectThrowaway />` line in [App.tsx](js/react/App.tsx)), same convention as Exercise 4 Demo 4's `KeyDemoThrowaway`.

- [x] Write, in your own words, a short rule for what belongs in render versus what belongs in an effect.

  If it only reads from props/state and produces a value to return as JSX (or a value derived from them), it belongs in render. If it reaches *outside* the component to touch something that isn't props/state — the DOM directly, `localStorage`, a timer, a subscription, a network request, mutating a variable that lives outside the function — it belongs in an effect (or, if it only ever needs to happen once at mount and doesn't need cleanup, a `useState` lazy initializer instead of a full effect).

**Questions** (depend on the tasks above)

- [x] Why can React call a component's render function more than once, or at times you don't expect (e.g. in development with Strict Mode)? What would go wrong with the side-effect example you found if render ran twice?

  React is allowed to call a component function more than once per actual screen update because render is contractually supposed to be pure, safe to call any number of times with the same inputs and get the same result, with no observable consequence from calling it extra times.
  
   `<StrictMode>` (now enabled in [main.tsx](js/react/main.tsx), it wasn't before this demo) deliberately exploits that contract in development, calling every component's render function twice per commit specifically to catch code that secretly assumes "this only runs once." Verified live with `RenderSideEffectThrowaway`: `renderCount` read 2 on first mount (not 1) and jumped by 2 per click of "Re-render" (confirmed 2→4→6), while the exact same code in a production build (`npm run build && npm run preview`, StrictMode is a dev-only no-op) started at 1 and incremented by 1 per click. 
   
   If `WorkspacePage`'s old `readNotes()` call had been something with an actual observable side effect (not just a read), double-invoking it would have doubled that effect too.

- [x] Is calculating a derived value (like the filtered evidence list from Exercise 5) a side effect? Why or why not, and how does that distinction inform the rule you wrote?

  No. `visibleEvidence` in `EvidencePage.tsx` only reads `data.evidence` and the filter/sort state (all props/state already in hand) and returns a plain value. 
  
  The distinction is "does it only transform inputs already available to this render into an output" (fine in render, no matter how many times it runs) vs. "does it read or write something that exists independently of this render and could give a different answer, or have a side effect, depending on when/how many times it's called" (belongs in an effect/initializer instead).

---

## Demo 2 — `useEffect` mental model & dependency arrays

**Tasks**

- [x] Write a small `useEffect` example (can be a throwaway one first) with an empty dependency array, one with a populated dependency array, and one with no array at all, and observe how often each one actually runs.

  [EffectDepsThrowaway.tsx](js/react/EffectDepsThrowaway.tsx), kept in the repo commented out in [App.tsx](js/react/App.tsx) (same convention as Demo 1's own throwaway). Verified live, on a genuinely fresh page load (a brand-new tab, not a Vite HMR reload, which inflates the counts with extra remounts):
  - No array: logged on mount, then again after every single click of either button.
  - Empty array `[]`: logged **twice** on mount, not once — `<StrictMode>` (Demo 1) double-invokes effects on mount in dev specifically to simulate "mount, clean up, mount again" and surface missing-cleanup bugs (Demo 3's own topic). Never logged again afterward, no matter how many times either button was clicked.
  - Array `[count]`: also double-logged on mount, then logged again only on the click that actually changed `count` — clicking "Increment other" re-rendered the component (the no-array effect fired again) but did *not* re-run this one.

- [x] Find a real, justified use for `useEffect` you'll need in this app (loading data is coming in Demo 5, so pick something else — e.g. syncing the document title to the current view).

  Took the exercise's own suggestion: [DocumentTitleSync.tsx](js/react/shell/DocumentTitleSync.tsx), rendered inside `<HashRouter>` in `App.tsx`. It reads the current route via `useLocation()` and sets `document.title` ([DocumentTitleSync.tsx:38-40](js/react/shell/DocumentTitleSync.tsx)) in a `useEffect` with `[location.pathname]` as the dependency. `document.title` is a browser API entirely outside React's own tree — nothing in props/state renders it — so it can't live in render itself; it has to be an effect. Verified live: navigating to each of the 5 views updates the browser tab's title correctly (`"Dashboard | ..."`, `"Evidence Catalogue | ..."`, `"People & Locations | ..."`, `"Locations | ..."`, `"Timeline | ..."`, `"Workspace | ..."`).

**Questions** (depend on the tasks above)

- [x] What does React actually compare, between renders, to decide whether to re-run an effect with a populated dependency array? What happens if you omit a value your effect actually uses from that array?

  React compares each value in the dependency array to its value from the *previous* render, using `Object.is` (the same reference-equality check `useState`'s setter uses) — if every value is unchanged, the effect is skipped; if even one differs, it re-runs. Omitting a value the effect actually uses means the effect keeps reading whatever that value was on the render where the effect last *ran*, not its current value — a stale closure. 
  
  Concretely, if `DocumentTitleSync`'s effect had `[]` instead of `[location.pathname]`, it would set the title once on mount and then never again, even though `location.pathname` keeps changing on every navigation — exactly the kind of bug this app would visibly have if I'd gotten that dependency array wrong.

- [x] What's the difference, in practice, between `useEffect(fn, [])` and just writing `fn()` directly in the component body? Why doesn't the second one work the way you'd expect for "run once"?

  `fn()` in the component body runs during render, every single render, with no way to limit it to "the first one" — there's no concept of "first render" available to plain code sitting in the function body, and (per Demo 1) render needs to stay pure, so putting `document.title = ...` there would be exactly the side-effect-in-render problem this whole chapter opened with. `useEffect(fn, [])` instead runs `fn` *after* React has committed the render to the screen, and only once, because React itself tracks "has this effect's dependency array changed since last time" and an empty array can only ever evaluate to "no" after the first run.

---

## Demo 3 — Cleanup: timers & subscriptions

**Tasks**

- [x] Implement at least one effect that sets up something needing cleanup (a `setTimeout`/ `setInterval`, a `window` event listener, or similar) and returns a proper cleanup function.

  A real one, not a throwaway: [TimelineEventItem.tsx](js/react/timeline/TimelineEventItem.tsx) got a "Quick view" button opening a small modal with each event's `personIds`/`locationIds`/`evidenceIds` — fields that have existed on `TimelineEvent` since Exercise 2 but were never rendered anywhere in this React view (the vanilla app's own equivalent, `openEvidenceModal()` in `js/views/timeline.ts`, never got migrated either, and is the exact bug this app tracks via `modalCloseListenerCount` — see below). While the modal is open, an effect ([TimelineEventItem.tsx:32-44](js/react/timeline/TimelineEventItem.tsx)) adds a `window` `keydown` listener so pressing Escape closes it, and removes that listener in its cleanup function. Verified live: opened a quick view, pressed Escape, it closed; reopened, clicked the backdrop and the × button separately, both worked too.

- [x] Demonstrate what happens (e.g. via a console log in both the effect and its cleanup) when the component unmounts or the dependencies change, with and without the cleanup function present.

  Built [CleanupThrowaway.tsx](js/react/CleanupThrowaway.tsx) specifically for this — a `setInterval` with `console.log` in both the effect and its cleanup ([CleanupThrowaway.tsx:37-47](js/react/CleanupThrowaway.tsx)), toggled on/off via a "Mount/Unmount timer" button, kept in the repo commented out same as every other throwaway demo.

  How to verify live:
  - **With cleanup**: clicking "Unmount timer" logged `[cleanup] clearInterval called` immediately, and `[interval] tick` stopped appearing — confirmed by watching the console for several seconds afterward with nothing further logged.
  - **Without cleanup** (temporarily swapped to the commented-out `TickingTimerNoCleanup`, which starts the same interval but never calls `clearInterval`): clicking Unmount then Mount again left the *old* interval still running underneath, invisible and untracked — confirmed by counting total log lines over a fixed 2-second window before vs. after one unmount/remount cycle, which showed tick volume had climbed well past 1-per-second. Reverted back to the real cleanup version afterward.

**Questions** (depend on the tasks above)

- [x] What actually calls your cleanup function, and when? Name at least two distinct situations that trigger it.

  React calls it itself, right before it's about to run the effect again or remove the component. 
  
  There are two distinct situations:
  1. the component unmounts entirely, closing the Timeline's quick-view modal removes it from the tree, which is what actually runs `TimelineEventItem`'s cleanup... except the keydown listener isn't on a component that unmounts when the modal closes, it's a dependency-array change instead:
  2. the effect's own dependency (`quickViewOpen`) changes value between renders, so React cleans up the *previous* run before starting the new one — closing the modal flips `quickViewOpen` to `false`, which doesn't match the effect's `if (!quickViewOpen) return;` guard, so the cleanup from the prior (`true`) run removes the listener before the effect body exits early this time.

- [x] What real, observable bug would you get in this app if you set up a subscription/timer in an effect but forgot the cleanup function? Be specific, not just "a memory leak."

  For the Timeline quick-view specifically: open a quick view, close it, open a *different* event's quick view, close that one too, repeated a few times — without the cleanup, every single open would add another `keydown` listener that's never removed, all still live. Pressing Escape once would then call `setQuickViewOpen(false)` multiple times in a row (once per leftover listener) — harmless here only because they all do the exact same idempotent thing, but concretely: open 3 modals in a row over a session without ever reloading, and the *4th* "Escape" press diagnostic would show 4 "close" calls firing for one keypress, confirmed via the exact same counting method used above on `CleanupThrowaway`'s interval. This is precisely the bug class `js/views/timeline.ts`'s own `modalCloseListenerCount` variable exists to track in the vanilla app — it increments forever because the vanilla modal's `addEventListener` call is never paired with a `removeEventListener` either.

---

## Demo 4 — Build the read-only Node backend

**Tasks**

- [ ] Set up a minimal Node.js server (Express or equivalent) with one GET endpoint per data
resource (case, evidence, people, locations, timeline), each returning the same shape of data
as the corresponding `data/*.json` file does today.
- [ ] Add a way to deliberately simulate real-world conditions for testing later demos: an artificial delay (configurable, e.g. via a query param or env var) on at least one endpoint, and a way to make one endpoint return an error response (e.g. a 500) on demand.
- [ ] Confirm the server runs locally alongside `vite dev` and is documented (a README section is enough) as dev-only (not part of the Exercise 2 deploy pipeline).

**Questions** (depend on the tasks above)

- [ ] Why does this exercise ask for artificial delay/error controls on the backend, instead of just pointing the frontend at the static JSON files directly (as it already could)? What could you *not* teach convincingly without them?
- [ ] What is CORS, and did you have to deal with it running your frontend (from Vite's dev server) against this separate backend server? If yes, what did you configure and why? If no, why not?

---

## Demo 5 — Consume the backend from React

**Tasks**

- [ ] Replace at least one view's data source (previously the static `data/*.json` fetch/import) with a real `fetch()` call to your new backend, wired up inside a `useEffect`.
- [ ] Do the same for the rest of the app's data sources, so the whole app now reads from your backend rather than static files.

**Questions** (depend on the tasks above)

- [ ] Walk through exactly what happens, in order, from the component mounting to the data actually being available to render: what does the effect do, when does it run, and what causes the component to re-render once the data arrives?
- [ ] What's different about your component now compared to before (when data came from a static
import/fetch of a local file). Specifically in terms of what state it needs to track that it
didn't need before?

---

## Demo 6 — Loading, error, and empty states

**Tasks**

- [ ] For at least one view, implement all three states explicitly: a loading indicator while the fetch is pending, a real error message if it fails (using your backend's on-demand error endpoint from Demo 4 to trigger it live), and a distinct "no data" empty state if the response is successful but contains nothing.
- [ ] Make sure these three states are visually and structurally distinguishable from each other, not all three collapsing into "shows nothing."

**Questions** (depend on the tasks above)

- [ ] Trigger your backend's error endpoint live and show the error state appearing. What state variable(s) are you tracking to distinguish "loading," "error," and "loaded successfully but empty" from each other?
- [ ] The original vanilla app had a bug where a failed fetch could leave a loading spinner stuck forever because the cleanup/hide-loading step was never called on the error path. Explain specifically how your React version's state management makes that particular mistake
harder to make (or show that it doesn't, and fix it).

---

## Demo 7 — Request races & cancellation

**Tasks**

- [ ] Using your backend's artificial-delay control, construct a request race: trigger a request, then trigger another one (for the same data) before the first resolves, and observe
what happens if you do nothing special about it. Does the UI ever show a result from the
*older* request after a newer one already resolved?
- [ ] Fix it using `AbortController` (or a request-id/"ignore stale response" guard, your choice), so the UI can never show a stale result.

**Questions** (depend on the tasks above)

- [ ] Reproduce the race live (with artificial delay dialed up) before your fix, then show the fix preventing it. What exact sequence of events causes the stale result to win without the fix?
- [ ] `AbortController` cancels the *request*. Does the effect's cleanup function run separately, or is aborting the fetch itself what you're doing inside the cleanup? Explain how the two connect in your implementation.

---

## Demo 8 — Extract a reusable custom hook

**Tasks**

- [ ] Extract the data-fetching logic (loading/error/empty state, the effect, cancellation) you've built across Demos 5–7 into at least one reusable custom hook (e.g. `useFetch<T>(url)` or a more specific `useEvidence()`), and use it in at least two different places.

**Questions** (depend on the tasks above)

- [ ] What makes something a legitimate custom hook rather than just a regular helper function? What rule(s) does React enforce about how/where hooks (including your custom one) can be called?
- [ ] Show the two places using your hook. What did extracting it save you from duplicating, and is there anything about the two usages that *couldn't* be shared and had to stay specific to each call site?

---

## Demo 9 — Separate UI, application logic, and API access

**Tasks**

- [ ] Organize your data-fetching code into distinct layers: a thin API-access layer (raw `fetch` calls, knows the backend's URLs/shapes and nothing else), your custom hook(s) from Demo 8 (application logic: loading/error/cancellation), and your components (UI only, no direct `fetch` calls anywhere in a component).
- [ ] Confirm no component in the app calls `fetch` directly anymore.

**Questions** (depend on the tasks above)

- [ ] If your backend's endpoint URLs or response shape changed tomorrow, how many files would you need to touch, and which ones? Would any component need to change?
- [ ] What's the argument *against* this separation for a small app like this one? E.g. when would the extra layering be overkill rather than helpful? Do you think it's justified here?

---

## Demo 10 — Data-flow wrap-up & a written UX decision

**Tasks**

- [ ] Illustrate the full data flow for one piece of data, end to end: the JSON file -> your backend endpoint -> the API-access layer -> your custom hook -> the component -> what's on screen.
- [ ] Explain a short, honest justification for one loading/error/empty-state UX decision you made (e.g. what your loading indicator looks like, how errors are worded, what "empty" looks like) and note one thing you'd do differently with more time.

**Questions** (depend on the tasks above)

- [ ] Walk through your diagram/illustration live, and for one step, explain what would break (and how you'd notice) if that step silently stopped happening.
- [ ] Across Exercises 3–6, this app went from "read static files instantly" to "fetch from a real, sometimes-slow, sometimes-failing server". What did that change force you to add that wasn't needed before and was any of it needed *conceptually* even back when the data source was a static file, just less visible?

---
