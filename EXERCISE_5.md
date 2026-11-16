# Exercise 5 — React Interactivity, State & Reactive Programming

This is the fifth exercise in Advanced Web Engineering Course (CSDC). It builds on Exercises 3 and
4. This exercise builds and fully wires up the **final two views: Evidence Catalogue and Workspace**, the two most state-heavy parts of the app (search, multiple filters, sorting, bookmarking, notes, and
the hypothesis form).

This exercise is, on purpose, a chance to solve several problems you already fixed *imperatively* back in Exercise 1: a dashboard count that could go stale, state that was represented in two places at once, and derived data that got confused with stored data.
Where relevant, the theory questions below ask you to explicitly compare your React solution to how you patched the same category of problem in vanilla JS.

**Out of scope for this exercise** (these come later): `useEffect`/data fetching (Exercise 6), a real backend, automated tests. 

## Corresponding manuscript reading

This exercise corresponds to **Chapter 17, React State, Interactivity, and Reactive Data Flow** in the course manuscript, especially "Responding to events" through "Common state-design problems" on pp. 115–123. The chapter transition and summary follow on pp. 124–125.

## Self-Check

The exercise is organized into 10 individual tasks with corresponding questions, that are
presented in class. 

These checkboxes are for self-checking. Don't forget to do the actual checking of tasks you are able to present in the Moodle course. **Before class, tick only what you can genuinely demonstrate or answer on the spot, live.**

| # | Demo | Ready? |
|---|---|---|
| 1 | Migrate event handling from vanilla listeners | ☐ |
| 2 | `useState` & controlled forms | ☐ |
| 3 | Immutable updates | ☐ |
| 4 | Derived values vs. stored state | ☐ |
| 5 | Lifting state to the nearest common owner | ☐ |
| 6 | Passing callbacks downward | ☐ |
| 7 | `useReducer` for the filter/search/sort state | ☐ |
| 8 | Context, and when not to use it | ☐ |
| 9 | Diagnose & fix common state problems | ☐ |
| 10 | Remove remaining direct DOM manipulation + wrap-up | ☐ |

---

## Demo 1 — Migrate event handling from vanilla listeners

**Tasks**

- [x] Build the Evidence Catalogue and Workspace views' static structure in React (cards, the filter toolbar, the notes list, the hypothesis form) if you haven't already, then migrate at least 3 real event handlers from the vanilla version (e.g. bookmark click, search input, save-note click) into React event handlers (`onClick`, `onChange`, `onSubmit`, etc.).

      Built 
      
      1. [EvidenceCard.tsx](js/react/evidence/EvidenceCard.tsx)
      2. [EvidenceFilterToolbar.tsx](js/react/evidence/EvidenceFilterToolbar.tsx)
      3. [EvidenceDetail.tsx](js/react/evidence/EvidenceDetail.tsx) and 
      4. [EvidencePage.tsx](js/react/evidence/EvidencePage.tsx) for the Evidence Catalogue
      
      [WorkspacePage.tsx](js/react/workspace/WorkspacePage.tsx) for the bookmarks list, notes list, and the full hypothesis form. Real data throughout, same CSS classes as the vanilla version, no new styles needed.

      Migrated 3 handlers: bookmark click ([EvidenceCard.tsx:36-42](js/react/evidence/EvidenceCard.tsx:36), `onClick`), search input ([EvidenceFilterToolbar.tsx:41](js/react/evidence/EvidenceFilterToolbar.tsx:41), `onChange`), and save-note click ([EvidenceDetail.tsx:143](js/react/evidence/EvidenceDetail.tsx:143), `onClick` calling `handleSaveNote` at [EvidenceDetail.tsx:67](js/react/evidence/EvidenceDetail.tsx:67)). Also added a 4th for free: opening a card's detail view ([EvidenceCard.tsx:31](js/react/evidence/EvidenceCard.tsx:31)).

      Deliberately left unwired this demo (real markup, real options, no handler yet, matching each one's own later demo): the other 5 filter selects + sort + clear (Demo 4/7), the hypothesis form entirely (Demo 2), and the detail view's status/relevance selects (Demo 6).

- [x] For each one, confirm the vanilla version's inline `onclick` attribute or manually-attached `addEventListener` is gone. React should own the event, not the DOM.

      `grep -rn "onclick=\|addEventListener" js/react/evidence/ js/react/workspace/` only matches two code *comments* describing the old vanilla approach being replaced, not any real code. All three migrated interactions are JSX `onClick`/`onChange` props, no DOM query, no manually attached listener anywhere in the new files.

**Questions** (depend on the tasks above)

- [x] How do you attach a click handler to a button in React versus how the vanilla version did it (inline `onclick="..."` in the HTML string, or `addEventListener` in JS)? What actually receives the event object in each approach, and is it the same kind of object?

    Vanilla: either `onclick="saveCurrentNote()"` baked into an HTML string (no event object reaches the function at all, it reads the DOM back out by id instead), or `addEventListener("click", handler)` where `handler` receives a real native `Event`/`MouseEvent`.
      
    React: `<button onClick={handleSaveNote}>` ([EvidenceDetail.tsx:143](js/react/evidence/EvidenceDetail.tsx:143)), a prop, not a string, so it's just a real JS function reference, no HTML string concatenation involved. 
    The handler receives a `SyntheticEvent`, React's own cross-browser wrapper object (same `.target`/`.stopPropagation()` shape you'd expect, but not literally the browser's native `Event` instance) - same *kind* of information, not the identical object.

- [x] The vanilla version's evidence-list click handling used event delegation (one listener on the container, checking `event.target`) partly to work around listeners being re-registered on
every render. Do you still need that pattern in React? Why or why not?

No. That pattern existed because `renderEvidenceList()` rebuilt the entire `<div class="evidence-grid">` as an HTML string on every re-render ([js/views/evidence.ts](js/views/evidence.ts)'s `container.innerHTML = html`), which would have destroyed and recreated a per-card listener every single time, one delegated container listener dodged that cost. 

React never does that becauase [EvidenceCard.tsx](js/react/evidence/EvidenceCard.tsx) declares its own plain `onClick` per card, and React's reconciler reuses the actual DOM node across re-renders (same identity, matched by `key={ev.id}` in [EvidencePage.tsx](js/react/evidence/EvidencePage.tsx)) instead of tearing it down, so there's no "re-registered every render" cost to work around in the first place.

---

## Demo 2 — `useState` & controlled forms

**Tasks**

- [x] Make the Evidence search box a controlled input (`value` + `onChange` backed by `useState`).

      [EvidenceFilterToolbar.tsx](js/react/evidence/EvidenceFilterToolbar.tsx) search `<input>` now has `value={searchTerm}` alongside the `onChange` Demo 1 already wired, `searchTerm` is [EvidencePage.tsx](js/react/evidence/EvidencePage.tsx)'s own `useState`, passed down as a prop.

- [x] Make the entire hypothesis form (suspect select, nature select, evidence multi-select,
confidence range, explanation and alternative textareas) fully controlled.

[WorkspacePage.tsx](js/react/workspace/WorkspacePage.tsx): one `useState<HypothesisDraft>` holds all 6 fields, every field now has both `value`/`onChange`, including the multi-select (`value={draft.evidenceIds}`, an array) and the range (`value={draft.confidence}`, with the `<output>` now reading `{draft.confidence}` instead of a hardcoded "50").

- [x] Wire the "Save hypothesis draft" action to read from your controlled state and persist it (still to `localStorage` for now).

      `handleSaveDraft()` in [WorkspacePage.tsx](js/react/workspace/WorkspacePage.tsx) writes `draft` straight to `localStorage` (`STORAGE_KEY_HYPOTHESIS`) and shows a "Saved" message for 2 seconds via a `showSaved` state flag, replacing the vanilla version's `classList.add/remove("hidden")` with plain conditional rendering. Verified live: filled every field, saved, reloaded the page, every field came back exactly as entered (confirmed via `localStorage.getItem("remotion_hypothesis")`).

**Questions** (depend on the tasks above)

- [x] What makes an input "controlled" versus "uncontrolled" in React? Show what happens if you try to type in one of your controlled inputs without wiring its `onChange` and explain, in terms of React's render cycle, *why* that happens.

      Controlled means the input's displayed value comes from React state (`value={...}`), the DOM element is never the source of truth, just a reflection of it. Uncontrolled means the DOM manages its own value, React just reads it when it needs to (or not at all).

      Tested live: temporarily commented out the search box's `onChange` while keeping `value={searchTerm}`. Typing into it did nothing, the field stayed frozen on whatever `searchTerm` already was, and React logged `"You provided a value prop to a form field without an onChange handler. This will render a read-only field..."` in the console. Why: every keystroke still fires a native DOM input event, but nothing calls `setSearchTerm`, so React re-renders with the exact same `searchTerm` it already had and writes that same `value` straight back onto the input, overwriting whatever the browser briefly displayed. Reverted immediately after confirming it.

- [x] The hypothesis form has several different input types (select, multi-select, range, textarea). Did you use one `useState` per field, or a single object? Justify your choice — and note this question again once you get to Demo 7 (`useReducer`), which asks you to reconsider it for a different form.

    I used on object here, with 6 different properties. I could have split it into different separate values wich useState but having this one object seemed the perfect fit.
    (Workspace View)
    Inside /workspace/WorkspacePage.tsx is the code.
    
      One object, `useState<HypothesisDraft>`. All 6 fields are only ever read, reset, or saved together as one "draft", never independently, and the vanilla version already modeled them as one `HypothesisDraft` interface written out as a single JSON blob. A `useState` per field would've meant 6 separate values that still only ever get used as a group, more hooks for no real benefit.
---

## Demo 3 — Immutable updates

**Tasks**

- [x] Find at least one place where your first instinct (or an early draft) would have mutated state directly (e.g. `evidence.bookmarked = true`, or pushing directly into a state array), and rewrite it as an immutable update.

    Immutable update = means producing a brand-new object/array with the change already applied, instead of modifying the existing one in place.

      `handleToggleBookmark` in [EvidencePage.tsx:103-109](js/react/evidence/EvidencePage.tsx:103) already used `.filter()`/spread from Demo 1, never actually shipped a mutating version.
      
       Wrote the "first instinct" version anyway as `handleToggleBookmarkBuggy`, kept commented out right after the real one ([EvidencePage.tsx:111-130](js/react/evidence/EvidencePage.tsx:111)), same convention as Exercise 4 Demo 4's `KeyDemoThrowaway`: it uses `.push()`/`.splice()` on `bookmarks` directly, then calls `setBookmarks(bookmarks)` with that same mutated array.

- [x] Add a case to your bookmark toggle logic that specifically exercises this: toggling a bookmark must produce a *new* array/object, not a mutated one.

      Verified live, both directions. Real handler: clicked a star on, then off, twice in a row, each click visibly flipped the star immediately, two genuinely new array references, two real re-renders. Buggy handler (temporarily swapped into `onToggleBookmark` to test): clicked a star, nothing changed on screen, but `localStorage.getItem("remotion_bookmarks")` showed the id *was* added, proving the state value changed in memory, React just never re-rendered. Swapped back to the real handler afterward.

**Questions** (depend on the tasks above)

- [x] Why does mutating state directly in React sometimes still appear to "work" on screen, but
cause real (possibly hard-to-track) bugs elsewhere? What is React actually comparing when it decides whether to re-render?

`useState`'s setter bails out of re-rendering when `Object.is(prevState, nextState)` is `true`, a cheap reference check, not a deep comparison. Mutating an array/object in place and passing that exact same reference back into the setter makes this check `true` every time, so React skips the re-render, the UI simply never updates, confirmed live above with the bookmark star.

It can look like it "works" when something else in the app happens to trigger an unrelated re-render around the same time (a parent re-rendering, another state update in the same batch): React repaints using whatever the mutated object currently holds, so the change appears on screen, but only as a side effect of a different render, not because this update was ever actually scheduled. 
That's the "possibly hard-to-track" part, it depends entirely on whether something unrelated happened to re-render nearby.

- [x] The original vanilla app had a real bug where sorting evidence mutated the master array via a shared reference, permanently losing the original order. Show how your React state update for the equivalent action (bookmark toggle, or sort, if you implement it) avoids that exact class of bug. Be specific about what's different, not just "React handles it."

      Found the real bug in [EXERCISE_1.md](EXERCISE_1.md) (Demo 2 there): `loadEvidenceData()` in the original `js/dataLoader.js` did `state.filteredEvidence = state.allEvidence;`, an alias, not a copy, both names pointed at the exact same array. `handleSortChange()` then called `.sort()` (an in-place mutator) on `filteredEvidence`, which silently reordered `allEvidence` too, since they were the same array underneath. The vanilla fix was `state.allEvidence.slice()`, one explicit shallow copy at the one place the alias was created.

      My bookmark toggle can't have this exact bug class at all, not because React "handles" aliasing, but because the *shape* of the update is different: `bookmarks.filter(...)` and `[...bookmarks, id]` each allocate a brand new array every single call, there is no step anywhere that assigns one variable to point at another's existing array (no `state.filteredEvidence = state.allEvidence` equivalent exists in this code at all). The vanilla bug needed two things to combine: an alias, and a mutator run on one of the two names. My code never creates the alias in the first place, so there's no shared reference left for any mutator to damage, structurally, not just "React re-renders so it's fine."

---

## Demo 4 — Derived values vs. stored state

**Tasks**

- [x] Implement the Evidence Catalogue's filtering/sorting so that the *filtered, sorted list is computed from* the full evidence list and the current filter/sort state, every render. Never stored as its own separate piece of state that could drift out of sync.

  The 5 remaining filter selects (type/person/location/status/relevance) and sort each got their own `useState` for "what the user picked" in [js/react/evidence/EvidencePage.tsx:56-62](js/react/evidence/EvidencePage.tsx). `visibleEvidence` ([EvidencePage.tsx:94-112](js/react/evidence/EvidencePage.tsx)) is computed from `data.evidence` plus all of those, every render, via `.filter().sort()` — there is no `filteredEvidence` state anywhere. "Clear filters" ([EvidenceFilterToolbar.tsx](js/react/evidence/EvidenceFilterToolbar.tsx)) resets all of them at once.

- [x] Do the same for the Dashboard's bookmark count and the Workspace's bookmarked-items list: both should be derived from the same single source of truth for bookmarks, not duplicated state.

  Both already did this since Demo 1: `DashboardPage.tsx`'s `bookmarksCount` ([DashboardPage.tsx:96](js/react/dashboard/DashboardPage.tsx)) and `WorkspacePage.tsx`'s `bookmarkedEvidence` ([WorkspacePage.tsx:119-120](js/react/workspace/WorkspacePage.tsx)) both call a `read...()` helper that reads `localStorage` fresh in the render body, not from a `useState`. Verified live: bookmarking 2 items from Evidence, then visiting Dashboard, shows "2" immediately with no stale/cached value.

**Questions** (depend on the tasks above)

- [x] What's the rule for deciding whether something belongs in `useState` versus being computed inline (or via `useMemo`) during render? Apply that rule to the filtered evidence list and justify your answer.

  If a value can be calculated from other state/props you already have, compute it inline, so don't store it. Only put something in `useState` if it's information React can't otherwise reconstruct (raw user input, fetched data).
  
   The filtered/sorted list is 100% calculable from `data.evidence` + the filter/sort state, so it stays a plain expression in the render body, not its own `useState`.

- [x] The vanilla app had two related bugs here: a dashboard bookmark count that could go stale (because it only re-rendered on a view's first visit), and a `filteredEvidence` variable that was sometimes literally the *same array reference* as the master list. Explain, concretely, why deriving these values during render instead of storing them makes **both** of those bug classes structurally impossible, not just less likely.

  Both vanilla bugs come from writing a derived value into a stored variable once and then forgetting to refresh it. If there is no stored variable to forget to refresh — it's a `const` recomputed every render — there is nothing that can go stale, and nothing that can alias the source array either, since `.filter()`/`.sort()` here always build/return a fresh array rather than reusing `data.evidence`'s reference.

---

## Demo 5 — Lifting state to the nearest common owner

**Tasks**

- [x] Identify the lowest common ancestor component of everywhere bookmark state needs to be read or changed (at minimum: an Evidence card's bookmark button, the Dashboard's bookmark count, and the Workspace's bookmarked-items list), and move the actual `useState` for bookmarks up to live there.

    I moved the bookmarks state (the useState<string[]> array) and the handleToggleBookmark function into App.tsx.

  `App` ([js/react/App.tsx](js/react/App.tsx)) is the lowest common ancestor — `DashboardPage`, `EvidencePage`, and `WorkspacePage` are siblings under its `<Routes>`, each mounted only while its own route matches. The `useState<string[]>(readBookmarks)` and `handleToggleBookmark` moved there ([App.tsx:63-73](js/react/App.tsx)), and are passed down as `bookmarks`/`onToggleBookmark` props to the 3 routes that need them ([App.tsx:106-121](js/react/App.tsx)).

- [x] Confirm that toggling a bookmark from the Evidence view is immediately reflected on the Dashboard the next time it's rendered.
  
    Verified live: bookmarked an evidence, switched to Dashboard (no reload, just a route change) — "Bookmarked" read 1 immediately. Switched to Workspace — the same item appeared in "Bookmarked Evidence" immediately too.

**Questions** (depend on the tasks above)

- [x] What does "lifting state up" actually mean, mechanically? Walk through where the bookmark state lived before you lifted it, and where it lives now.

  Mechanically: delete the `useState` from the child, add it to a shared ancestor instead, and pass the value (and a setter/callback for changing it) down as props. Before: `EvidencePage` owned `useState<string[]>`, while `DashboardPage`/`WorkspacePage` each independently called their own `localStorage.getItem` in their render body — three separate reads of one key, no shared value in memory. 
  
  Now: only `App` calls `useState`/`readBookmarks` ([App.tsx:63](js/react/App.tsx)), and the other three components receive `bookmarks` (and `EvidencePage` also `onToggleBookmark`) purely as props.

- [x] What would go wrong (be specific) if you had instead kept a separate `useState` for bookmarks inside each of the Dashboard, Evidence, and Workspace components?

  Each component's `useState` would only read `localStorage` once, on its own mount (lazy initializer), and never again. 
  
  Bookmarking something on Evidence would update Evidence's own copy and `localStorage`, but Dashboard's/Workspace's already-mounted copies wouldn't know anything changed — they'd keep showing whatever count/list they loaded when they first mounted.

---

## Demo 6 — Passing callbacks downward

**Tasks**

- [x] From wherever you lifted bookmark state to (Demo 5), pass a callback (e.g. `onToggleBookmark`) down through props to every component that needs to trigger a change, rather than letting child components reach up and mutate anything themselves.

  Already in place since Demo 5: `App` defines `handleToggleBookmark` ([App.tsx:67-73](js/react/App.tsx)) and passes it to `EvidencePage` as `onToggleBookmark`, which passes it straight through to each `EvidenceCard` ([EvidencePage.tsx:204](js/react/evidence/EvidencePage.tsx)). `EvidenceCard`'s bookmark button calls it directly ([EvidenceCard.tsx:41](js/react/evidence/EvidenceCard.tsx)) — it never touches `bookmarks` itself.

- [x] Do the same for at least one more interaction that needs to affect state owned by a parent (e.g. saving a note, or changing evidence review status from the detail view).

  Wired "changing evidence review status from the detail view", the example this task names. `EvidencePage` owns `data.evidence` and defines `handleEvidenceStatusChange`/`handleEvidenceRelevanceChange` ([EvidencePage.tsx:140-158](js/react/evidence/EvidencePage.tsx)), each updating `data` immutably via `.map()`. Both are passed to `EvidenceDetail` as `onStatusChange`/`onRelevanceChange` ([EvidenceDetail.tsx](js/react/evidence/EvidenceDetail.tsx)), which now has real controlled `<select>`s (`value`, not `defaultValue`) that call them.

**Questions** (depend on the tasks above)

- [x] Why can't (or shouldn't) a deeply nested child component just directly modify state that lives in a distant ancestor? What does passing a callback down get you instead?

  Because most of the times it can't. A child only receives what its parent passes as props, and a parent's own `useState` setter isn't one of those unless the parent explicitly hands it down. 
  
  Passing a named callback instead (`onStatusChange`, not `setData`) means the child declares *intent* ("I want to change the status") while the parent keeps full control of how that happens — the immutable `.map()` update stays in one place, not duplicated or done wrong in every child that needs to trigger it.

- [x] Trace one callback all the way from where it's defined (with the actual `useState` setter inside it) down to the component that calls it. How many component layers does it pass through, and does that feel like "too many". Is prop drilling becoming a real problem here?

  App.tsx -> Line 63 and Line 63-73 ()

  `onToggleBookmark`: defined in `App` (closes over `setBookmarks`) → passed to `EvidencePage` as a prop → passed straight through, unchanged, to `EvidenceCard` as a prop → called from the card's button `onClick`. 3 layers (App → EvidencePage → EvidenceCard), and the middle one (`EvidencePage`) doesn't use it at all, just relays it. That "pass-through, unused at this layer" step is exactly what prop drilling means, and with only one callback and 3 layers it's not a real problem yet

---

## Demo 7 — `useReducer` for the filter/search/sort state

**Tasks**

- [x] Identify the Evidence Catalogue's combined filter state (search term, type, person, location, status, relevance, and sort order — 7+ related values that often change together or need to be reset together) as a single non-trivial state domain, and replace its `useState` calls with a single `useReducer`.

  The 7 `useState` calls Demo 4 introduced (`searchTerm`, `filterType`, `filterPersonId`, `filterLocationId`, `filterStatus`, `filterRelevance`, `sortOrder`) are now one `useReducer(filtersReducer, INITIAL_FILTERS)` ([EvidencePage.tsx:113](js/react/evidence/EvidencePage.tsx)), with `EvidenceFiltersState`/`EvidenceFiltersAction` and `filtersReducer` defined above the component ([EvidencePage.tsx:65-103](js/react/evidence/EvidencePage.tsx)).

- [x] Implement at least 3 distinct action types (e.g. `SET_FILTER`, `SET_SORT`, `CLEAR_FILTERS`).

  Exactly those 3: `SET_FILTER` (one generic action for all 6 text fields, keyed by `field`), `SET_SORT`, and `CLEAR_FILTERS` ([EvidencePage.tsx:77-80](js/react/evidence/EvidencePage.tsx) for the action types, [EvidencePage.tsx:96-102](js/react/evidence/EvidencePage.tsx) for the reducer's cases).

**Questions** (depend on the tasks above)

- [x] Why is this particular piece of state ("evidence filters") a better fit for `useReducer` than for a pile of individual `useState` calls? What specifically got easier once you switched?

  Because these 7 values aren't independent, theya are read together (every filter feeds the same `visibleEvidence` computation) and sometimes need to change together (`CLEAR_FILTERS` touches all 7 at once). 
  
  A reducer makes "what can happen to this state" an explicit, closed list of action types instead of 7 separately-callable setters; `handleClearFilters` as 7 individual `setX("")` calls (the Demo 4 version) is gone, replaced by one `dispatch({ type: "CLEAR_FILTERS" })`.

- [x] Show your `CLEAR_FILTERS` action. How does a reducer make "reset several related values at once, consistently" easier to get right than resetting them individually?

  ```ts
  case "CLEAR_FILTERS":
    return INITIAL_FILTERS;
  ```

  With 7 separate `useState`s, clearing meant calling 7 setters in a row by hand — add an 8th filter later and it's easy to forget to add its reset call too, silently leaving one field "stuck". With one object and one action, `CLEAR_FILTERS` just returns the one `INITIAL_FILTERS` constant; a new field added to 
  `EvidenceFiltersState` is automatically covered because it's already part of that same object.


- [x] Is `useReducer` fundamentally different from `useState`, or is `useState` essentially a special case of the same underlying idea? Justify your answer.

  useReducer is a React hook, which is a  a built-in function, same category as useState, not an object you construct. It’s an alternative way to store state in a component.

  Where useState gives you a value and a setter (const [count, setCount] = useState(0)), useReducer gives you a value and a dispatch function, plus you write a separate reducer function that decides how the value changes.

  `useState` is the special case. Both store a value and trigger a re-render when it changes.
  
   `useReducer` just names the transitions (actions) instead of letting any caller set the next value directly. In fact React's own `useState` is implementable on top of `useReducer` with a trivial reducer that ignores the action type and returns whatever value was dispatched — `setCount(5)` is the same shape as `dispatch(5)` through `(state, action) => action`.

---

## Demo 8 — Context, and when not to use it

**Tasks**

- [x] Pick one piece of state from this exercise (bookmark state is a strong candidate, given Demo 6's prop-drilling question) and actually implement it via React Context, replacing the prop-drilled version.

  Picked bookmark state, as suggested. New file [js/react/BookmarksContext.tsx](js/react/BookmarksContext.tsx) holds `BookmarksContext`, a `BookmarksProvider` component (owns the `useState`/`localStorage` read-write, unchanged from Demo 5/App.tsx), and a `useBookmarks()` hook.
  
   `App.tsx` now just wraps the whole router in `<BookmarksProvider>` ([App.tsx:46](js/react/App.tsx)) with no bookmarks state or props on any `<Route>` ([App.tsx:55-68](js/react/App.tsx)). `DashboardPage`, `EvidencePage`, and `WorkspacePage` each call `useBookmarks()` directly instead of receiving a prop.

- [x] Explain a short, honest decision: for *this specific app*, at its *current* size, is Context actually the right call for this state, or is prop-drilling (or lifting state, without Context) good enough? Be ready to defend whichever answer you land on.

  Prop-drilling was already fine here in my opinion with 3 layers, 1 callback.
  
   The actual improvement Context buys in this app isn't solving a drilling crisis, it's removing bookmarks from `App.tsx`'s job description: before, `App` had to hold domain data it has no interest in, purely to relay it to 3 routes. That's a real small win for this app's size.

**Questions** (depend on the tasks above)

- [x] What problem does Context actually solve? What does it *not* solve (people sometimes expect it to behave like global state management. Where does that expectation break down)?

  Context solves exactly one problem: letting a component read a value from a distant ancestor without every component in between having to accept and relay it as a prop. It does *not* give you anything like global state management. There's still exactly one `useState` underneath it (inside `BookmarksProvider`), one single source of truth, scoped to wherever the `Provider` wraps. 
  
  People expect it to behave like a global store (read/write from anywhere, no provider needed, maybe some kind of persistence or selectors) — it has none of that. Call `useBookmarks()` outside a `BookmarksProvider` and it throws ([BookmarksContext.tsx:92-96](js/react/BookmarksContext.tsx)), it doesn't silently hand back some app-wide default.

- [x] Revisit Demo 6's callback-depth question. Was prop drilling there actually a real problem (annoying, error-prone, worth solving) or a manageable one? What's your threshold for reaching for Context instead of just drilling one more level?

  It was manageable, not really a real problem.
  
   Demo 6 had  3 layers, 1 callback, the only "pass-through" was `EvidencePage` relaying it once. 
   
   My threshold: reach for Context when a value needs to cross through an ancestor that has no business owning it architecturally (exactly what happened to `App.tsx` here), or when the same prop has to be threaded through 3+ genuinely unrelated branches of the tree.

- [x] "Unnecessary global state" is explicitly named as a common problem. Could using Context here be an example of that, even though Context isn't technically the same as a global variable?

  A little, yes, if taken too far. Bookmarks genuinely are read by 3 unrelated pages, so Context fits.
  
  I'd also moved the Evidence filters or the hypothesis draft into Context "while I'm at it". State that's only ever used by the one component that owns it, that would be the "unnecessary global state" problem in a different costume: making something reachable from everywhere when nothing outside its own component tree ever needed it, just because Context was already set up and available.

---

## Demo 9 — Diagnose & fix common state problems

**Tasks**

- [x] Review your own Evidence/Workspace/Dashboard code specifically for: duplicated state (the same fact represented in two places), stale state (a value that doesn't update when it should), excessive prop drilling, unnecessary global state, and any remaining direct mutation.

  Reviewed all 3 pages plus `EvidenceDetail`/`BookmarksContext`. Prop drilling and unnecessary global state are already handled (Demos 5-8); no remaining direct mutation found (confirmed by re-checking every `.filter()`/`.map()`/`.sort()`/`setX()` call). Found 2 real instances of the other two categories, detailed below.

- [x] Find and fix at least 2 real instances (they can be ones you introduced yourself while building this exercise, that's normal and expected, not a failure).

  1. Duplicated state (self-introduced in Demo 6): `EvidenceDetail`'s status/relevance callbacks only updated `EvidencePage`'s own in-memory `data.evidence`, never persisted. `DashboardPage` and `WorkspacePage` each fetch their own independent copy of `evidence.json`, so neither ever saw the edit, and even `EvidencePage` itself lost it the moment it unmounted and refetched. Verified live: changed "Robot diagnostic log" to Reviewed, Dashboard's "Reviewed" count stayed at 1 (not 2), and navigating back to Evidence showed it reverted to Unreviewed. Fixed with a new shared module, [js/react/evidenceOverrides.ts](js/react/evidenceOverrides.ts): `applyEvidenceOverrides()` re-applies any saved status/relevance edits right after each page's own fetch, and `writeEvidenceOverride()` persists them to `localStorage` (same pattern as bookmarks/notes). Deliberately a plain function, not a Context — the underlying evidence fetch stays independent per page (Exercise 3/4's own documented choice); only the override layer needed one shared definition. Wired into all 3 pages: [EvidencePage.tsx:151,203,215](js/react/evidence/EvidencePage.tsx), [DashboardPage.tsx](js/react/dashboard/DashboardPage.tsx), [WorkspacePage.tsx](js/react/workspace/WorkspacePage.tsx).

  2. Stale state (self-introduced in Demo 2): `WorkspacePage.handleSaveDraft` ([WorkspacePage.tsx:162-172](js/react/workspace/WorkspacePage.tsx)) called `setTimeout(() => setShowSaved(false), 2000)` with no cleanup. Navigating away from Workspace within that 2-second window still left the timer running, trying to update state on an already-unmounted component. Fixed with a `savedTimeoutRef` ([WorkspacePage.tsx:104](js/react/workspace/WorkspacePage.tsx)) that tracks the pending timeout and a cleanup `useEffect` ([WorkspacePage.tsx:111-115](js/react/workspace/WorkspacePage.tsx)) that clears it on unmount; `handleSaveDraft` also clears any still-pending timer before starting a new one.

**Questions** (depend on the tasks above)

- [x] For each of the 2 issues you fixed: which of the five named categories did it fall into, and how did you notice it (a visible bug, a code-review-style re-read, React DevTools, something else)?

  #1 is duplicated state, noticed by deliberately reproducing it live (not an accidental discovery) after re-reading the Demo 6 code and realizing nothing ever wrote the status change to `localStorage`. 
  
  #2 is stale state, noticed in a code-review-style re-read, not a visible symptom. Apparently React 19 actually removed the console warning for calling `setState` on an unmounted component that older React versions used to show, so there was nothing on screen or in the console pointing at i.

- [x] Of the five named problems (duplicated state, stale state, prop drilling, unnecessary global state, mutation), which one is this app's history (Exercise 1's bugs) most clearly an example of? Explain the connection directly.

  Duplicated state. Exercise 1 Demo 2's bug was `state.filteredEvidence = state.allEvidence`, two variable names for what was supposed to be two independent facts (the full list vs. the filtered view), aliased into one shared array that a `.sort()` call then corrupted for both. 
  
  The evidence-overrides bug I just fixed in this demo is the same root problem wearing a different costume: not two names for one array, but the same real-world fact (one evidence item's status) represented by 3 separate, never-synced in-memory copies, one per page. Different mechanism (aliasing vs. independent fetches), same category: a single real-world fact that the code lets drift into multiple disagreeing representations.

---

## Demo 10 — Remove remaining direct DOM manipulation + wrap-up

**Tasks**

- [ ] Do a final sweep of the Evidence Catalogue and Workspace views (and re-check Dashboard/People & Locations/Timeline from Exercises 3–4) for any remaining direct DOM manipulation, e.g. `document.querySelector`, manual `classList` changes, `innerHTML`, anything not going through React's render, and remove it.
- [ ] Confirm the whole app (all 5 views) now runs entirely on React state and props, with zero manual DOM manipulation anywhere.

**Questions** (depend on the tasks above)

- [ ] Show one state-management decision you made somewhere in this exercise (state ownership, `useState` vs. `useReducer`, prop drilling vs. Context, or something else) that you're not 100% sure was the right call. Explain the trade-off honestly, both directions.
- [ ] Across Exercises 3–5, name one bug category from the *original* vanilla app (Exercise 1's defect list) that is now, by construction, no longer possible in your React version — not just fixed, but structurally prevented. Explain why the React architecture rules it out.

---
