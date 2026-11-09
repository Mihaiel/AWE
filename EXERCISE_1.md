# Exercise 1 — Refactoring the App

This is the first exercise in Advanced Web Engineering Course (CSDC). You will **not add any new
features** in this exercise. The goal is to make the existing application correct and more
maintainable, understand advanced JavaScript topics, and get comfortable with your browser's
developer tools along the way.

**Out of scope for this exercise** (these come later in the course): migrating to TypeScript,
introducing a build tool, splitting into a full separation-of-concerns architecture beyond plain
modules, parallelizing/optimizing the async data loading, and any framework migration. If you
notice things related to those topics while you work, write them down (you'll come back to them).

Keep a running note of what you changed and why (a `CHANGES.md`, or commit messages, your choice!).
Several theory questions ask you to explain a specific change you made, and for bug fixes, **using
real commits is the easiest way to show a before/after live in class**. E.g. commit the reproduction
state (or just note the commit hash before your fix) so you can diff it against your fix on demand.

## Self-Check

The exercise is organized into 10 individual tasks with corresponding questions, that are
presented in class. Every task and every question has its own checkbox — you can't answer a
question convincingly without having actually done its task first.

These checkboxes are for self-checking. Don't forget to do the actual checking of tasks you are
able to present in the Moodle course. **Before class, go through and tick only what you can
genuinely demonstrate or answer on the spot, live.** An unticked box is fine, but remember that you
need to at least tick ~70% of tasks on all exercises for a positive course grade. "I fixed it" is
not enough for any bug-related item: you need to be able to explain *why* it was broken and *why*
your fix works.

| # | Demo | Ready? |
|---|---|---|
| 1 | Split the app into JS modules | ☑ |
| 2 | Bug hunt — mutation/reference bug | ☑ |
| 3 | Bug hunt — an asynchronous/Promise-handling bug | ☑ |
| 4 | Bug hunt — silent (console-only) bug | ☑ |
| 5 | Bug hunt — full walkthrough & reflection | ☑ |
| 6 | Use the JavaScript debugger | ☑ |
| 7 | DevTools tour (Console/Network/Application/Elements) | ☑ |
| 8 | Clean coding: globals, `var`/`let`/`const`, code smells | ☐ |
| 9 | Refactor nested Promises to `async`/`await` | ☐ |
| 10 | Refactor to arrow functions | ☐ |

A demo only counts as "Ready" once **every** task and question checkbox inside it (below) is
ticked — the table above is just a fast overview, tick the boxes inside each demo first.

---

## Demo 1 — Split the app into JS modules

`app.js` is currently one file, well over a thousand lines, mixing data loading, global state,
rendering for every view, event handling, and utility functions. Split it into multiple files using
native ES modules (`import`/`export`). No bundler, no build step, just modules the browser loads
directly.

**Tasks**

- [x] Design a module boundary you can justify, and implement it (e.g. data loading, shared state,
      one module per view's rendering, `localStorage` helpers, small formatting/lookup utilities,
      and an entry-point module that wires up navigation and event listeners on startup).
- [x] Update `index.html` to load your entry point with `<script type="module" src="...">` instead
      of the current plain `<script src="app.js">`.
- [x] Do this as a **pure refactor first**: the app must behave identically before and after (bugs
      and all — you are not fixing anything yet in this demo). Re-run the app after every few
      changes and confirm nothing new broke.
- [x] Decide deliberately, function by function, what needs to be exported and what can stay
      private to its module. Not everything needs to be public.

**Questions** (depend on the tasks above)

- [x] What is the difference between a classic `<script>` and a `<script type="module">`? Name at
      least two behavioral differences that are relevant to this app.

      The difference between a classic script and a module is usually the scope and closure. 
  
      A classic `<script>` runs its top-level code directly in the global scope, so every top-level `function` and `var` in the old `app.js` automatically became a property of `window`. A `<script type="module">` doesn't do that, every file gets its own module scope and nothing leaks to `window` on its own, even though it still looks like top-level code. I actually ran into this for real, `index.html` calls things like `onclick="navigateTo('dashboard')"` straight from an HTML attribute, and inline handlers like that look the function up on the global object the moment they fire. After switching to modules that lookup would've failed with "navigateTo is not defined", so I had to explicitly do `window.navigateTo = navigateTo;` (and five others) in `js/main.js` just to keep the markup working. Second difference is that module scripts are deferred and run in document order once parsing is done, and they're strict mode automatically, no need to opt in.

- [x] Before your refactor, `allEvidence` was a global `var`, readable and writable from anywhere in
      `app.js`. After splitting into modules, what has to happen for a different module to read or
      change that value? What error do you get if you forget, and why is that error actually
      useful?

      Whichever module needs the global `allEvidence` now needs to import the module that actually holds the variable/state.

      The module that wants to use `allEvidence` now has to `import` it from wherever it's defined. In my split that's `import { state } from "./state.js"`, and then you read/write it as `state.allEvidence`. One thing that tripped me up while planning this: an imported binding is read-only in the module that imports it, you can change its properties but you can't reassign the name itself from outside the module that declared it. That's exactly why I didn't export `allEvidence` on its own, I wrapped it in one `state` object instead so every module can do `state.allEvidence = data;` without trying to reassign an import. Forget the import entirely and you get `Uncaught ReferenceError: allEvidence is not defined`, or `does not provide an export named ...` if you typo the name.

- [x] What's the difference between a named export and a default export? Point to one place in your
      refactor where you chose one over the other, and explain why.

      A module can have as many named exports as it wants and you have to import them by their exact name (or rename with `as`), a default export is just one per module and the importer can call it whatever they like. I ended up using only named exports everywhere in this refactor because almost every module exports more than one related thing, `js/utils.js` alone has seven small helper functions, and a view module like `js/views/evidence.js` exports several (`renderEvidenceList`, `openEvidenceDetail`, `closeEvidenceDetail`, `handleSortChange`, ...). Because the project is so massive and the app.js was bloated, none of them refactoring files that i made inside /js has one obvious "main" export that deserves to be the default.

- [x] Why won't `type="module"` scripts run at all if you open `index.html` directly from disk
      (`file://...`) instead of through a local HTTP server? (You already need a server for
      `fetch()` — is this the same reason, a different one, or both?)

  Related but not quite the same reason. `fetch()` against `file://` fails because the Fetch spec just doesn't define how to "fetch" a local file that way, browsers treat `file://` as an opaque origin with no real CORS story. Module scripts hit a similar wall but one level earlier: loading a module graph goes through the same origin checks that `fetch()` uses, and under `file://` there's no real origin to check against, so the browser refuses to load the module at all (you'd see something like "Cross origin requests are only supported for HTTP" in the console) before any of my own code, including my fetch calls, gets a chance to run. So same underlying cause, the browser's origin rules not being satisfied by `file://`, but it blocks two different things: one stops the module script from loading in the first place, the other stops a request my code makes once it's already running.

---

## Demo 2 — Bug hunt: a mutation/reference bug

The app has several independent defects hidden across its views. Find them the way you would on a real project: by using the app thoroughly, reading error output, debugging and reasoning about the code once you have a reproducible symptom.

For this demo specifically, find and fix a bug where an array or object gets changed in a place
that surprises you (something is mutated that shouldn't have been, or two things that were supposed
to be independent turn out to be linked).

**Tasks**

- [x] Reproduce the bug reliably and write down the exact steps.

  Steps: load the app, go to the Evidence view, change the "Sort evidence" dropdown to anything other than "Newest first" (e.g. Title A-Z), then go to the Workspace view and look at the "Selected supporting evidence" list in the Hypothesis Draft form. Instead of showing E01, E02, E03... in order like it normally does, it shows the evidence in whatever order you just sorted the *other* view by. The Workspace's note list and bookmarked list get scrambled the same way. I checked it from the console too (`state.filteredEvidence === state.allEvidence` → `true` before the fix), so it's not just a visual coincidence.

- [x] Form a hypothesis for the root cause and confirm it (not just patch the symptom).

  Since I refactored before, in `js/dataLoader.js`, `loadEvidenceData()` did `state.filteredEvidence = state.allEvidence;`. that doesn't copy the array, it just points `filteredEvidence` at the exact same array object as `allEvidence`. `handleSortChange()` in `evidence.js` then calls `.sort()` directly on `state.filteredEvidence`, and `Array.prototype.sort()` sorts in place, so it also reorders `allEvidence` since they're the same array underneath. Confirmed it with a quick console check: before the fix `state.filteredEvidence === state.allEvidence` was `true`, and `state.allEvidence.map(e => e.id)` came back scrambled right after sorting the evidence view. So it wasn't a rendering glitch, the master data array itself was getting reordered.

- [x] Fix it, and verify the fix doesn't break anything else nearby.

  Changed that one line to `state.filteredEvidence = state.allEvidence.slice();`, which makes a shallow copy of the array instead of reusing the same one. Sorting `filteredEvidence` now only reorders its own array, `allEvidence` stays in the original E01...E18 order no matter what you sort by. Re-ran the same repro after the fix and `allEvidence` stayed intact, the Workspace dropdown kept its correct order, and the sort itself still worked fine on `filteredEvidence` (checked the titles came back alphabetically where expected).

**Questions** (depend on the task above)

- [x] Explain — in your own words — the difference between a *reference* and a *copy* in
      JavaScript, and how that distinction explains what you observed.

  Arrays and objects in JS are assigned by reference, so `var b = a;` doesn't create a second array, `b` and `a` just both point at the exact same thing in memory. Only primitives (numbers, strings, booleans) get copied by value. `state.allEvidence.slice()` creates an actual new array with its own memory, copies of the references to the same evidence objects but a brand new outer array, so sorting it doesn't touch the original array's order anymore. That's exactly the distinction that explains the bug, `filteredEvidence = allEvidence` looked like "give me a filtered view of the data" but was really "give me a second name for the same array", so any in-place operation on one showed up on the other too.

- [x] Walk through the exact user actions and system state that trigger the bug. Could you have
      found it by reading the code top-to-bottom without running it? Why or why not?

  Data loads → `loadEvidenceData()` sets `filteredEvidence = allEvidence` (aliased at this point). User opens the Evidence view and changes the sort dropdown → `handleSortChange()` runs `state.filteredEvidence.sort(...)`, which reorders the shared array in place. User then opens Workspace, which always re-renders from `state.allEvidence` directly → the hypothesis dropdown, notes list and bookmarks list all show the now-reordered data. I think I could've spotted it by reading the code, the assignment on its own looks a bit suspicious since `filteredEvidence` is supposed to be a separate, derived thing, but it's the kind of thing that's easy to skim past since the line by itself isn't wrong, it only becomes a bug once you connect it to the `.sort()` call in a completely different function in a different file. Running it and actually seeing unrelated views change was what made it obvious.

---

## Demo 3 — Bug hunt: an asynchronous/Promise-handling bug

Find and fix a bug caused by how the app handles a Promise-based operation — for example,
something that should update once an async operation finishes but doesn't, or state that gets
checked before (or without ever) being properly set by an async callback. This does not have to be
flaky or timing-sensitive to reproduce. The point is that you can't explain the root cause without talking about
*when*, relative to a Promise/callback, something did or didn't happen.

**Tasks**

- [x] Reproduce the bug reliably and write down the exact steps.

  Load the app and go straight to the Evidence view, before or after the data finishes loading doesn't matter. The toolbar (search/filters/sort) shows up fine but the list area underneath just shows a spinner and "Loading evidence…" forever, the cards never appear. I checked from the console that `state.allEvidence` had all 18 items loaded while this was happening, so the spinner isn't waiting on anything real, it's stuck.

- [x] Form a hypothesis for the root cause, expressed in terms of the async operation involved (what
      was supposed to happen once it resolved, and what actually happened instead), and confirm it.

  The async operation is the `fetch("data/evidence.json")` in `loadEvidenceData()`. Once that promise resolves, its `.then()` is supposed to both fill `state.allEvidence` *and* tell the evidence view it's done loading, but it only did the first part. `evidenceViewLoading` in `evidence.js` starts `true` and nothing anywhere ever flips it back to `false`, so `renderEvidenceList()` keeps bailing out into the loading branch no matter how long you wait or how many times the data actually loads. Confirmed by checking `state.allEvidence.length` in the console right after navigating to Evidence, it was already `18`, full data, spinner still stuck.

- [x] Fix it, and verify the fix actually addresses the async handling rather than papering over the
      symptom (e.g. don't just add a delay or a retry if the real issue is a missing state update).

  Added a small exported function in `evidence.js`, `markEvidenceDataLoaded()`, that just sets `evidenceViewLoading = false`, and called it from inside the evidence fetch's success `.then()` in `dataLoader.js`, right after `state.allEvidence` gets set. That's it, no delay, no retry, no polling, just making sure the state the view checks actually gets updated once the thing it's waiting on is done. Reloaded and the evidence cards render immediately once the fetch resolves, and bookmarking, search, filtering, sorting and opening a detail view all work now that the list actually shows up.

**Questions** (depend on the task above)

- [x] Explain the async operation this bug revolves around: what does it fetch/return, and at what
      point in its lifecycle (before it starts, while pending, on success, on failure) does the bug
      actually happen? How did you confirm that, rather than just guessing?

  It's the `fetch("data/evidence.json")` call in `loadEvidenceData()`, which returns the array of 18 evidence items used basically everywhere in the app. The bug sits specifically in the "on success" part of its lifecycle, the fetch starts fine, stays pending for a moment, and resolves successfully with real data every time, there's no failure involved at all. The problem is that the success callback updates `state.allEvidence` but never updates `evidenceViewLoading`, so from the evidence view's perspective the load never "finished" even though it did. I confirmed this wasn't a guess by checking `state.allEvidence.length` in the console while the spinner was showing, it was already `18`, so the data had clearly arrived, the view's own loading flag was just never told.

---

## Demo 4 — Bug hunt: a silent bug

Open DevTools *before* you start clicking around, and keep the Console tab visible for your entire
testing session. Find a bug that produces **no visible change in the UI** — only console output
(an error, a warning, or an unexpected logged value).

**Tasks**

- [x] Reproduce the bug and capture the exact console output.

  Saved a note for evidence E01 first (just set it in localStorage directly: `{"E01": "Checked the profile mismatch, looks like a cache-key scoping issue."}`), then reloaded the app. Nothing visible changes anywhere on the page. But the console logs `First note preview: {[[PromiseState]]: fulfilled, [[PromiseResult]]: "Checked the profile mismatch, looks like a cache-key scoping issue."}` instead of just the note text, that weird `[[PromiseState]]`/`[[PromiseResult]]` object is Chrome's way of showing you an unresolved Promise that got logged directly.

- [x] Trace it back to the line(s) of code responsible.

  `initApp()` in `js/main.js`, the last two lines inside the `loadAllData().then(...)` callback: `var firstNote = loadNoteAsync("E01"); console.log("First note preview:", firstNote);`. `loadNoteAsync` (in `storage.js`) returns `new Promise(resolve => resolve(...))`, so `firstNote` is the Promise itself not the string since nothing ever unwraps it.

- [x] Fix it, and confirm the console is clean for that scenario afterward.

  Changed it to chain a `.then()` onto `loadNoteAsync("E01")` and log the resolved value inside that callback, instead of logging the Promise directly. Kept it as `.then()` rather than switching to `async`/`await`, since that conversion belongs to Demo 9. Reloaded with the same seeded note and the console now logs `First note preview: Checked the profile mismatch, looks like a cache-key scoping issue.`, plain text there is no Promise object.

**Questions** (depend on the task above)

- [x] How did you notice this bug in the first place, given that nothing looked broken? Why is
      "nothing looks broken" not the same as "nothing is broken"?

  I only noticed it because I happened to have the console open while testing something else entirely, Demo 1's refactor, and saw a weird-looking object logged on every page load. Nothing on screen ever referenced this value, it's logged and then just thrown away, so there was no visual symptom to chase, I had to go looking for the line that produced it. That's why "nothing looks broken" isn't the same as "nothing is broken". The UI only shows the parts of the state that get rendered somewhere, a bug in a value that's only ever console.logged (or stored but never read, or computed and discarded) can sit there without a user noticing.

---

## Demo 5 — Bug hunt: full walkthrough & reflection

Use every feature, in every view, more than once. Dashboard stats, evidence search/filter/sort/
bookmark/detail/notes, people & locations tabs and their cross-links, timeline sorting/filtering/
evidence links, and the workspace (bookmarks list, notes, hypothesis form — including reloading the
page afterward to check what persisted). Try things a "well-behaved" user wouldn't, eg click buttons
rapidly, type quickly and delete what you typed, navigate away mid-action, reload at odd times,
resize the window, inspect and hand-edit `localStorage` in DevTools, leave a field empty, select the
same filter twice. Keep going past Demos 2–4 — this app does not have only three bugs.

**Tasks**

- [x] For every bug you find (beyond the three already covered), write down: reproduction steps,
      expected vs. actual behavior, root cause, the fix, and how you verified it.

  **Bug A — corrupting the notes key in localStorage bricks the entire app.** Repro: open DevTools, go to Application/Storage, edit the `remotion_notes` key to something invalid like `{not valid json`, reload. Expected: the app should at worst lose your notes. Actual: the app never even finishes loading, "Loading case file…" spins forever, nothing works, not even navigation. Root cause: `loadNotesFromStorage()` in `js/storage.js` did `state.notesStore = JSON.parse(raw);` with no try/catch, and it's called synchronously near the very start of `initApp()`, before `setupEventListeners()` and `loadAllData()`. An uncaught `SyntaxError` there aborts the rest of `initApp()`, so none of the event listeners get attached and no data ever loads. Confirmed with the exact console stack trace (`at loadNotesFromStorage ... at initApp`). Fixed by wrapping the `JSON.parse` in a try/catch that falls back to an empty notes object, same pattern `loadBookmarksFromStorage()` already used. Verified by corrupting the key again after the fix, the app now loads normally with a console warning instead of dying.

  **Bug B — same thing, smaller blast radius, for the hypothesis draft.** Repro: corrupt the `remotion_hypothesis` key, go to the Workspace view. Expected: either the draft loads or, if it can't, the rest of the view still works. Actual: `loadHypothesisFromStorage()` in `js/views/workspace.js` throws for the same reason (`JSON.parse` with no try/catch), but since it's the last call inside `renderWorkspace()`, only the hypothesis-restoring part fails, bookmarks and notes still render fine, just with a console error and a blank hypothesis form. Fixed the same way as Bug A. Verified the same way, the form just starts blank with a warning logged, nothing else breaks.

  **Bug C — Timeline shows "Location: [object Object]".** Repro: open the Timeline view, look at the location line under any event. Expected: something like "L01 - Human-Robot Interaction Laboratory". Actual: literally the text "[object Object]". Root cause: in `js/views/timeline.js`, `renderTimeline()` does `eventLocationNames.push(evtLoc || item.locationIds[el]);`, pushing the whole location *object* straight into the array it later joins into a string, instead of pulling out `.name`/`.id` like the evidence detail view already does for the same kind of lookup. Fixed by pushing `evtLoc.id + " - " + evtLoc.name` instead, matching the pattern used elsewhere. Verified visually, the location now reads correctly on every timeline entry.

  **Bug D — nav buttons throw a console error on every click.** Already flagged back in Demo 1. Repro: click any nav button, open console. Expected: just the view switches, maybe a clean log line. Actual: `Uncaught TypeError: Cannot read properties of undefined (reading 'getAttribute')`, every single click. Root cause: `setupEventListeners()` in `js/main.js` loops with `var i` and registers one closure per button that reads `navButtons[i]` when it's actually clicked, long after the loop has finished and `i` already equals `navButtons.length`. Fixed by changing `var i` to `let i`, which gives every iteration (and therefore every closure) its own `i` instead of one shared one. Verified: clicking nav buttons now logs `nav clicked: <view>` cleanly with no error.

- [x] Pick one bug from your full list (any of them, including Demos 2–4) and prepare to show it
      live: the broken behavior, then your fix. **Commit the pre-fix state (or note its commit
      hash) so you can diff broken vs. fixed on demand in class.**

  Picking the Demo 2 mutation/reference bug for this, it has its own dedicated commit (nothing else bundled into it), it's easy to narrate, and it's a good one to reason through live since the broken behavior is genuinely non-obvious. `git show <demo-2-commit-hash>` on this repo diffs cleanly to just that one line. Bug A (the localStorage one from this demo) is my backup, it's more dramatic to watch break live since the whole app just hangs, but I like that Demo 2 forces you to actually explain reference vs. copy on the spot rather than just pointing at a visibly broken screen.

**Questions** (depend on the tasks above)

- [x] For the bug you chose to present: walk through the exact user actions and system state that
      trigger it, live, starting from the pre-fix commit.

  Starting from the pre-fix commit: data loads, `loadEvidenceData()` sets `filteredEvidence = allEvidence`, same array, two names. I open the Evidence view and change the sort dropdown, `handleSortChange()` sorts `filteredEvidence` in place, which (being the same array) reorders `allEvidence` too, live, in front of everyone. I then switch to the Workspace view, which always re-renders from `allEvidence` directly, and the hypothesis dropdown shows the evidence in the scrambled order instead of E01...E18. Then I check out the fix commit and do the exact same thing again, Workspace keeps the correct order no matter how I sort Evidence, because `filteredEvidence` is its own array now.

- [x] Across all the bugs you found, did fixing one ever change the symptoms of, reveal, or
      accidentally fix another? If so, explain the relationship. If not, how did you confirm your
      fixes were properly isolated from each other?

  There's one real relationship, even though it never actually caused trouble because of the order I fixed things in. Before Demo 3's fix, the evidence list never rendered at all, so Demo 2's mutation bug (sorting `filteredEvidence` corrupting `allEvidence`) had no way to show up *inside* the Evidence view itself, the only place it was ever visible was Workspace, reading `allEvidence` in whatever order it ended up in. If I had fixed Demo 3 (the loading spinner) before Demo 2 (the aliasing), sorting the now-visible evidence list would have immediately shown the corrupted order right there in the Evidence view too, not just in Workspace, the same bug would've looked worse once the list was actually visible. Because I fixed Demo 2 first, that interaction never got the chance to surface. For the rest (Bugs A, B, C, D here, plus Demo 4), I didn't find any real interaction, they touch completely different files and functions (`storage.js`'s notes parsing, `workspace.js`'s hypothesis parsing, `timeline.js`'s location lookup, `main.js`'s nav loop), so I confirmed isolation the straightforward way: after every single fix I re-ran the full walkthrough across all five views again and checked that every previously-fixed bug's repro still showed the fixed behavior, not just the one I'd just touched.

---

## Demo 6 — Use the JavaScript debugger

`console.log` is a debugging tool, not *the* debugging tool. This demo is about using the browser's
actual debugger or a VS Code extension for debugging — ideally on one of the bugs from Demos 2–5.

**Tasks**

- [x] Set at least one real breakpoint (not a `console.log`) inside a function connected to a bug
      you investigated, and step through it line by line.

  Used Safari's Web Inspector on branch `01/02` (still has the Demo 1 nav-button bug unfixed, good for this). Set a breakpoint inside the nav-button click callback in `setupEventListeners()` (`js/main.js`), on the line reading `navButtons[i].getAttribute("data-view")`, clicked a nav button, and it paused right there without needing a reload (this code reruns on every click, unlike `initApp()` which only runs once at page load).

- [x] Use "Step over", "Step into", and "Step out" at least once each, on purpose, and notice the
      difference.

  Used all three while paused in that same callback.

- [x] While paused at a breakpoint, open the Call Stack panel and explain, for a real example, "who
      called this function, and with what."

  The Call Stack panel in the Sources tab filled in automatically the moment the breakpoint hit, no separate step to open it.

- [x] Use a **conditional breakpoint** or a **logpoint** at least once (e.g. only break when a loop
      variable equals a specific value, or a specific ID is being processed).
- [x] While paused, use the Scope/Watch panel (or hover over variables) to track a value across
      several steps of execution, and edit a variable's value live to test a hypothesis before
      writing the actual code change.

**Questions** (depend on the tasks above)

- [x] What's the difference between "Step over" and "Step into"? Give a concrete example from this
      app where using the wrong one would waste your time.

  Step over runs the current line (including whatever function it calls) without following execution inside that function, step into actually jumps into the called function's own code so you can watch it line by line. In the nav-button callback, `getAttribute("data-view")` is a native DOM method, stepping into it doesn't get you anywhere since there's no JS source for the browser to show, so it just behaves like a step over anyway, that would be wasted effort if you expected to see something. A better example of where picking wrong actually costs you time is `handleBookmarkClick()` in `js/views/evidence.js`, it calls `saveBookmarksToStorage()` and then `renderEvidenceList()`. If you're trying to figure out why a bookmark isn't actually being saved to localStorage and you step over `saveBookmarksToStorage()`, you skip right past the only place that would show you, you'd need to step into it instead. Step out is the one that gets you back, if you've stepped into a small helper like that and don't need to walk through the rest of it line by line, step out just finishes it and returns you to the caller.

- [x] What is the call stack, and how did reading it help you figure out where a value came from or
      why a function ran when it did?

  The call stack is the chain of function calls that led to the line you're currently paused on, innermost (where you are) at the top, down to whatever ultimately kicked it off. Paused inside the nav-button click callback, the top frame was that anonymous callback itself, confirming this specific pause was caused by the button's own click listener firing, not by some other code path calling into it indirectly. Since that callback has exactly one place it's attached from (the `addEventListener` call in the loop), the stack was short, but it's the same idea for functions that get called from several places (like `renderEvidenceList()`, which the router, the bookmark handler, and the sort handler can all trigger), the call stack is what tells you which one actually triggered this particular run.

- [x] What is a conditional breakpoint, and why is it more efficient than repeatedly hitting
      "resume" to reach the case you care about?
- [x] What's the difference between a breakpoint you set in the DevTools UI and a `debugger;`
      statement written directly in the source code? When would you prefer one over the other?

  A UI breakpoint lives only in your own browser session, it's not part of the source file, so it never accidentally ends up in a commit and disappears the moment you close the tab (or clear it yourself). A `debugger;` statement is written directly into the code, so it travels with the file, if it's left in by accident it pauses the debugger for anyone who runs that code with DevTools open, including in production. I'd reach for a UI breakpoint almost always since it's quick to toggle and leaves no trace, `debugger;` is more for a spot you want to guarantee pauses no matter how the code got there (e.g. sharing a small repro file with someone else) or when you're editing code live and don't want to re-find the line in the Sources tree every reload.

- [x] Describe a moment where `console.log` alone would *not* have been enough to find a bug, but
      stepping through with the debugger was. What did the debugger show you that logging couldn't?

  For the nav-button bug, a `console.log(i)` inside the callback would've just printed `navButtons.length` every time, which does tell you something is off, but not why in an obvious way without also separately logging `navButtons.length` and reasoning about timing after the fact. Pausing with the debugger and actually being in that moment, able to hover `i` and `navButtons.length` side by side and see the call stack confirming this run came from a real click (long after the loop that created the closures had already finished), made the "the loop is long done, every closure shares the one left-over `i`" explanation obvious immediately, instead of something I'd have to piece together from printed values.

---

## Demo 7 — DevTools tour: Console, Network, Application, Elements

A guided tour, so you know where things live before you need them.

**Tasks**

- [x] **Console:** filter down to only errors, then only warnings, using the log-level filter. Use
      the text filter box to search for one specific message. Try "Preserve log" and explain what
      it changes.

  Filtered to errors/warnings separately, then used the text box to search for "note" to isolate the note-related log lines. "Preserve log" keeps everything logged before a reload instead of clearing the console on navigation, useful for exactly the kind of boot-sequence bugs this app has.

- [x] **Network:** reload with the Network tab open, find the requests for the app's JSON data
      files, and for one request inspect its status code, response body, and timing. Throttle the
      connection (e.g. "Slow 3G") and reload.

  `data/evidence.json` comes back 200, body is the array of 18 evidence objects, loads almost instantly on a local server. Throttled to Slow 3G and reloaded, same requests, just stretched out over a couple of seconds each instead of milliseconds.

- [x] **Application** (Chrome) / **Storage** (Firefox): find this app's `localStorage` entries,
      inspect their values, edit one directly in DevTools, and reload to see the effect. Replace a
      value with text that isn't valid JSON and see what happens.

  Three keys: `remotion_bookmarks`, `remotion_notes`, `remotion_hypothesis`. Edited a note's text directly and reloaded, it stuck. Corrupted `remotion_notes` to invalid JSON and reloaded, this is the exact Demo 5 bug, confirmed the fixed behavior holds now, a console warning instead of the app hanging forever.

- [x] **Elements:** inspect a rendered evidence card or person card in the DOM, and connect what you
      see there back to the code that generated it.

  Inspected an evidence card, the `.evidence-card` div with its bookmark button, title, badges and tag chips all map 1:1 to the string concatenation in `renderEvidenceCardHTML()` in `js/views/evidence.js`, down to the exact class names.

**Questions** (depend on the tasks above)

- [x] What's the practical difference between `console.log`, `console.warn`, and `console.error`,
      beyond just the color?

  Beyond the color/icon, `console.error` also captures and shows a stack trace and is what the "errors" filter catches, same for `console.warn` with the "warnings" filter, `console.log` is neither, it's just output. This app actually uses all three for real distinctions, `console.error` for a failed fetch, `console.warn` for the Demo 5 try/catch fallbacks, `console.log` for plain info like "nav clicked."

- [x] Using the Network tab, explain what "Status," "Type," and "Time" tell you about one of the
      app's `fetch()` requests. If that request returned a 404 instead of a 200, how would the app
      currently react?

  For `data/evidence.json`: Status 200 means the server found and returned it, Type is `fetch`/`xhr` (not a document or script load), Time is how long the round trip took. If it 404'd, `fetch()` itself wouldn't reject, since `fetch` only rejects on a network-level failure, a 404 is still a "successful" response as far as `fetch` is concerned. But `loadEvidenceData()` never checks `res.ok`, it just calls `res.json()` on whatever came back, and a 404 page's body usually isn't valid JSON, so `res.json()` itself would reject, which the `.catch()` already there would pick up, logging "Failed to load evidence.json" and showing the alert.

- [x] List this app's `localStorage` keys and what each one is for. What happens if you manually
      corrupt one of them and reload — and *why* does that happen, according to the code that reads
      it back out?

  `remotion_bookmarks` (which evidence IDs are starred), `remotion_notes` (the per-evidence text notes), `remotion_hypothesis` (the saved draft in the Workspace form). Corrupting any of them used to throw straight out of `JSON.parse` and, for notes especially, take the whole app down with it since it's read during boot, exactly the bug fixed in Demo 5. Now it's caught and logged as a warning instead.

- [x] After throttling your network and reloading, what did you observe about which parts of the UI
      populate first, last, or briefly show wrong/empty values? Why does the order matter here?

  The static HTML (header, nav, toolbar, empty containers) shows immediately since that's not waiting on anything. The dashboard intro card is next since it doesn't depend on fetched data at all. Everything backed by a fetch, the stat counts, evidence/people/timeline content, only fills in once its own request finishes, and since `case.json` → `people.json` → `locations.json` are chained one after another while `evidence.json` and `timeline.json` run in parallel alongside that chain, under throttling you can actually see the dashboard's evidence/timeline panels populate at a different moment than the people/locations-dependent parts. The order matters because nothing here is lazy or loading-state-aware beyond the one overlay, if you blinked at the wrong moment under a slow connection you'd catch some panels still empty while others are already filled in.

---

## Demo 8 — Clean coding: globals, `var`/`let`/`const`, code smells

**Tasks**

- [ ] List every top-level `var` at the top of the original `app.js`. For at least three of them,
      explain what could go wrong if two unrelated pieces of code both tried to use a variable with
      that name — and how your module split from Demo 1 already prevents (or doesn't yet prevent)
      that.
- [ ] Go through the codebase and replace `var` with `const` or `let` everywhere it's declared,
      deciding `const` vs. `let` deliberately for each one.
- [ ] Identify at least two more "code smells" anywhere in the app, beyond the globals above. Fix
      them, and explain why they were bad and how your fix addresses that.

**Questions** (depend on the tasks above)

- [ ] What is the difference between `var`, `let`, and `const` in terms of scope and reassignment?
      Give a concrete example — from this codebase or a hypothetical grounded in a pattern you saw
      — of a bug that `var`'s scoping rules make *possible* and `let` would prevent.
- [ ] What is an "accidental global," and how does non-strict-mode JavaScript allow it to happen by
      simply forgetting a keyword? Now that your code runs as ES modules (which are always strict
      mode), what happens instead if you make that same mistake?
- [ ] "The code technically works" and "the code is clean" are not the same bar. Give one concrete
      example from this app of something that worked correctly but was still worth refactoring —
      and explain what real cost the messy version has (bug risk, onboarding time, review
      difficulty...).

---

## Demo 9 — Refactor nested Promises to `async`/`await`

**Tasks**

- [ ] Find the most deeply nested chain of `.then()` calls in the data-loading code. Before
      touching it, sketch/describe its shape (how many levels deep, and what has to succeed before
      the next level even starts).
- [ ] Rewrite it as an `async` function using `await`, preserving its exact current behavior —
      **including** that it currently loads its requests one after another rather than in parallel
      (don't fix that yet, that's a later exercise).
- [ ] Do the same conversion for at least one more place in the app that currently uses
      `.then()`/`.catch()`/`.finally()`, making sure any error handling the original had is still
      present.
- [ ] Verify with the debugger (a breakpoint inside your new `async` function, stepping through with
      the Call Stack panel open) that the order of operations is unchanged from before your
      refactor.

**Questions** (depend on the tasks above)

- [ ] Explain, in your own words, why the nested `.then()` chain you sketched is harder to reason
      about than the `async`/`await` version — even though they run identically.
- [ ] What does the `await` keyword actually do to the execution of the `async` function it's
      inside? What is the rest of the *program* doing while that function is "waiting"?
- [ ] An `async` function always returns a Promise, even if the code inside it does
      `return someValue;` for a plain value. Prove you understand this: what do you get if you call
      `.then()` on the result of your refactored function, and log it?
- [ ] What is the `async`/`await` equivalent of a `.catch()`? What happens at runtime if you forget
      it and the `await`ed operation rejects?
- [ ] Is `async`/`await` code *faster* than the equivalent `.then()` chain? Explain precisely what
      does and doesn't change about execution when you do this kind of refactor.
- [ ] Deliberately break your own refactor by removing one `await` you just added (leaving the
      function still `async`). What breaks, and how does that relate to a category of bug you may
      have already dealt with in Demos 2–5 (a Promise being treated as if it were already-resolved
      data)?

---

## Demo 10 — Refactor to arrow functions

**Tasks**

- [ ] Choose at least two functions currently written as `function name(...) { ... }` or
      `function(...) { ... }`, and rewrite them as arrow functions — pick ones that are actually
      good candidates.
- [ ] Convert at least one anonymous `function(e) { ... }` callback passed to `addEventListener`
      into an arrow function.
- [ ] Identify **one** function you deliberately did *not* convert (or would refuse to, if asked),
      and be ready to explain why it would be unsafe or incorrect as an arrow function.

**Questions** (depend on the tasks above)

- [ ] What is different about how arrow functions handle `this` compared to regular functions? Why
      does that make arrow functions risky as object methods, but often preferable as callbacks?
- [ ] Arrow functions can't be used as constructors (no `new`) and have no `arguments` object of
      their own. Did either limitation affect which functions you were able to convert? Which one,
      and how?
- [ ] Function declarations (`function foo() {}`) are hoisted, so you can call them before they
      appear later in the file; a `const`/`let` arrow function is not. Did this matter anywhere in
      your refactor? Explain why or why not.
- [ ] Show a concrete before/after of one function you converted. Is there any behavioral difference
      at runtime, or is this purely a readability/style change? Justify your answer.
- [ ] This codebase mixes function declarations, function expressions, and (after this exercise)
      arrow functions, with no single consistent rule. Propose one rule your team could adopt for
      "when do we use which," and justify it.

---

## What to bring to class

For each of the 10 demos: your changed code (ideally as commits you can diff live), and the ticked
checkboxes above reflecting what you can genuinely demonstrate and answer *right now*. Be ready to
open DevTools live on request, not just describe what you did.
