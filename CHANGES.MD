# CHANGES

Running notes on what I changed and why, one branch per task, merged into main once I'm happy with it.

## Exercise 1

### Demo 1 — Split the app into JS modules

Refactored, deleted app.js and split the whole project into /js and further into /views and other interfaces.

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

### Demo 2 — Bug hunt: mutation/reference bug

There was a bug, and it can be replicated by:
1. Go to the Evidence View.
2. Change from "Newest" to something like "Title A-Z".
3. Go to the Workspace View.
4. Under "Selected supporting incident" you can see that the list is completely mixed.

The Issue:
`state.filteredEvidence = state.allEvidence.slice();` inside `/js/dataLoader.js`. The slice fixed it.

Found it in `js/dataLoader.js`: `loadEvidenceData()` did `state.filteredEvidence = state.allEvidence;`, which just makes `filteredEvidence` point at the same array as `allEvidence` instead of giving it its own. `handleSortChange()` then sorts `state.filteredEvidence` in place with `.sort()`, and since both variables were the same array underneath, sorting the evidence view also silently reordered the master `allEvidence` array — which then messed up the Workspace's hypothesis dropdown, notes list and bookmarks list, all of which just read straight from `allEvidence` in whatever order it happens to be in.

Confirmed before fixing: `state.filteredEvidence === state.allEvidence` was `true`, and sorting the evidence list by title actually scrambled `allEvidence.map(e => e.id)` too. Fixed with `state.filteredEvidence = state.allEvidence.slice();` instead, a shallow copy, so the two arrays are independent from the start. Re-tested the same repro after the fix: `allEvidence` keeps its original order no matter what you sort the evidence view by, and the sort itself still works correctly on `filteredEvidence`. Full repro steps and the explanation are in EXERCISE_1.md under Demo 2.

### Demo 3 — Bug hunt: async/Promise-handling bug

This is the "Loading evidence…" spinner that never goes away, already flagged under Demo 1. Checked with the console that `state.allEvidence` actually had all 18 items loaded while the Evidence view still showed the spinner, so it's not that the fetch was slow or failing, the data was there the whole time.

Root cause in `js/views/evidence.js`: `evidenceViewLoading` starts `true` and `renderEvidenceList()` bails out early showing the spinner whenever it's `true`, but nothing anywhere ever sets it back to `false`. The `fetch("data/evidence.json")` in `loadEvidenceData()` (in `dataLoader.js`) resolves just fine and fills `state.allEvidence`, but its `.then()` callback never told the evidence module that loading was done, it only updated the shared `state`, not the view's own private loading flag.

Fixed by adding `markEvidenceDataLoaded()` in `evidence.js` (just sets `evidenceViewLoading = false`) and calling it from inside `loadEvidenceData()`'s success `.then()`, right after `state.allEvidence` gets set and before the conditional `renderEvidenceList()` call. Only did this in the success path, the `.catch()` branch still wouldn't clear the spinner on a failed fetch either, but that's not reachable in this app since the JSON files always load, so I left that alone rather than fixing something that was never actually a problem here.

Tested after the fix: evidence cards render immediately once data loads, no more stuck spinner, and bookmarking/search/filter/sort/opening a detail view all work on the list now that it actually renders (previously untestable since the list never showed anything). Nothing else changed.

### Demo 4 — Bug hunt: silent bug

Found this one just reading the console on a normal page load, no UI symptom at all: `initApp()` in `js/main.js` logs `"First note preview:"` followed by whatever `loadNoteAsync("E01")` returns. That function returns a Promise, but the code never awaited or chained it, so `console.log` just printed the Promise object itself. To make it obvious this wasn't just an empty-string edge case, I seeded a note for E01 in localStorage first, reloaded, and the console showed `{[[PromiseState]]: fulfilled, [[PromiseResult]]: "Checked the profile mismatch..."}` instead of the plain note text.

Fixed by chaining a `.then()` onto `loadNoteAsync("E01")` instead of using its return value directly, kept it in `.then()` style rather than jumping to `async`/`await` since that conversion is specifically Demo 9's job. After the fix the console correctly logs just the note string, confirmed with the same seeded-note setup as before and after.
