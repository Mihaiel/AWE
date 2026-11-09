# CHANGES

Running notes on what I changed and why, one branch per task, merged into main once I'm happy with it.

## Exercise 1

### Demo 1 — Split the app into JS modules

Split the old 1085-line app.js into ES modules under js/, and pointed index.html at js/main.js with `type="module"` instead of the old plain script tag. This was a pure refactor, didn't fix anything on purpose, just moved code around and changed how the pieces talk to each other.

Module layout: `state.js` holds everything more than one module touches (allEvidence, bookmarks, caseData, etc.) as one exported object, since you can't reassign an imported variable from another module but you can mutate its properties. `utils.js` has the small lookup/formatting helpers, `storage.js` wraps localStorage, `dataLoader.js` does the fetch() calls, `router.js` handles hash navigation, then one file per nav view (dashboard/evidence/people/timeline/workspace), and `main.js` as the entry point wiring up the event listeners.

Not everything went into shared state though. A few variables (`selectedEvidence`, `currentPeopleTab`, `evidenceViewLoading`, `modalCloseListenerCount`, `latestSearchRequestId`, `loadingStepsRemaining`) are only ever touched by exactly one module, so those just stayed as plain local variables in the module that owns them instead of being put in state.js for no reason.

The one thing that would've silently broken the app: `index.html` still calls functions straight from inline `onclick`/`onchange` attributes (and a couple more get written into generated HTML strings). Those lookups happen on the global object the moment they fire, but a module's top-level functions don't attach to `window` automatically the way a classic script's do. So I had to manually expose `navigateTo`, `switchPeopleTab`, `handleSortChange`, `saveHypothesis`, `closeEvidenceDetail`, `saveCurrentNote` and `renderEvidenceList` on `window` from `main.js` — otherwise clicking any nav button would've thrown "navigateTo is not defined" immediately.

Some bugs that have been reported while refactoring, to be honest refactoring the whole thing alone would have been a big mess, so I used an agent to locate bugs and verified them. Here is the log:

- `evidenceViewLoading` starts `true` and nothing in the whole codebase ever sets it back to `false`, so the evidence list spinner never clears and the cards never render. Confirmed this live in the browser, not just a reading mistake.
- `loadNoteAsync("E01")` in `initApp()` gets logged straight away without awaiting it, so the console just prints the Promise object instead of the actual note text.
- the nav button click listeners are registered in a `for` loop using `var`, so by the time anyone actually clicks a button the loop variable already points one past the end of the array, and the handler throws trying to read `.getAttribute` off `undefined`. Happens on every single nav click.
- `renderTimeline()` pushes the whole location object into `eventLocationNames` instead of its name when the lookup succeeds, so the timeline shows "Location: [object Object]".
- `filterStatus` gets `renderEvidenceList` attached twice, once via `addEventListener` and once via `setAttribute("onchange", ...)`. Harmless, just redundant.

Tested by clicking through all five views, the people/locations tabs, opening the timeline's quick-view modal into the full evidence detail, saving a note and a hypothesis draft, then reloading to check bookmarks/notes/hypothesis still come back from localStorage. All the bugs above reproduced identically before and after the refactor so nothing new broke.
