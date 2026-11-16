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

- [ ] Identify the lowest common ancestor component of everywhere bookmark state needs to be read or changed (at minimum: an Evidence card's bookmark button, the Dashboard's bookmark count, and the Workspace's bookmarked-items list), and move the actual `useState` for bookmarks up to live there.
- [ ] Confirm that toggling a bookmark from the Evidence view is immediately reflected on the
Dashboard the next time it's rendered.

**Questions** (depend on the tasks above)

- [ ] What does "lifting state up" actually mean, mechanically? Walk through where the bookmark state lived before you lifted it, and where it lives now.
- [ ] What would go wrong (be specific) if you had instead kept a separate `useState` for bookmarks inside each of the Dashboard, Evidence, and Workspace components?

---

## Demo 6 — Passing callbacks downward

**Tasks**

- [ ] From wherever you lifted bookmark state to (Demo 5), pass a callback (e.g. `onToggleBookmark`) down through props to every component that needs to trigger a change, rather than letting child components reach up and mutate anything themselves.
- [ ] Do the same for at least one more interaction that needs to affect state owned by a parent (e.g. saving a note, or changing evidence review status from the detail view).

**Questions** (depend on the tasks above)

- [ ] Why can't (or shouldn't) a deeply nested child component just directly modify state that lives in a distant ancestor? What does passing a callback down get you instead?
- [ ] Trace one callback all the way from where it's defined (with the actual `useState` setter
inside it) down to the component that calls it. How many component layers does it pass through, and does that feel like "too many". Is prop drilling becoming a real problem here?

---

## Demo 7 — `useReducer` for the filter/search/sort state

**Tasks**

- [ ] Identify the Evidence Catalogue's combined filter state (search term, type, person, location, status, relevance, and sort order — 7+ related values that often change together or need to be reset together) as a single non-trivial state domain, and replace its `useState` calls with a single `useReducer`.
- [ ] Implement at least 3 distinct action types (e.g. `SET_FILTER`, `SET_SORT`, `CLEAR_FILTERS`).

**Questions** (depend on the tasks above)

- [ ] Why is this particular piece of state ("evidence filters") a better fit for `useReducer` than for a pile of individual `useState` calls? What specifically got easier once you switched?
- [ ] Show your `CLEAR_FILTERS` action. How does a reducer make "reset several related values at once, consistently" easier to get right than resetting them individually?
- [ ] Is `useReducer` fundamentally different from `useState`, or is `useState` essentially a
special case of the same underlying idea? Justify your answer.

---

## Demo 8 — Context, and when not to use it

**Tasks**

- [ ] Pick one piece of state from this exercise (bookmark state is a strong candidate, given Demo 6's prop-drilling question) and actually implement it via React Context, replacing the prop-drilled version.
- [ ] Explain a short, honest decision: for *this specific app*, at its *current* size, is Context actually the right call for this state, or is prop-drilling (or lifting state, without
Context) good enough? Be ready to defend whichever answer you land on.

**Questions** (depend on the tasks above)

- [ ] What problem does Context actually solve? What does it *not* solve (people sometimes expect it to behave like global state management. Where does that expectation break down)?
- [ ] Revisit Demo 6's callback-depth question. Was prop drilling there actually a real problem
(annoying, error-prone, worth solving) or a manageable one? What's your threshold for reaching for Context instead of just drilling one more level?
- [ ] "Unnecessary global state" is explicitly named as a common problem. Could using Context here be an example of that, even though Context isn't technically the same as a global variable?

---

## Demo 9 — Diagnose & fix common state problems

**Tasks**

- [ ] Review your own Evidence/Workspace/Dashboard code specifically for: duplicated state (the same fact represented in two places), stale state (a value that doesn't update when it should), excessive prop drilling, unnecessary global state, and any remaining direct mutation.
- [ ] Find and fix at least 2 real instances (they can be ones you introduced yourself while
building this exercise, that's normal and expected, not a failure).

**Questions** (depend on the tasks above)

- [ ] For each of the 2 issues you fixed: which of the five named categories did it fall into, and how did you notice it (a visible bug, a code-review-style re-read, React DevTools, something else)?
- [ ] Of the five named problems (duplicated state, stale state, prop drilling, unnecessary global state, mutation), which one is this app's history (Exercise 1's bugs) most clearly an example of? Explain the connection directly.

---

## Demo 10 — Remove remaining direct DOM manipulation + wrap-up

**Tasks**

- [ ] Do a final sweep of the Evidence Catalogue and Workspace views (and re-check Dashboard/People & Locations/Timeline from Exercises 3–4) for any remaining direct DOM manipulation, e.g. `document.querySelector`, manual `classList` changes, `innerHTML`, anything not going through React's render, and remove it.
- [ ] Confirm the whole app (all 5 views) now runs entirely on React state and props, with zero manual DOM manipulation anywhere.

**Questions** (depend on the tasks above)

- [ ] Show one state-management decision you made somewhere in this exercise (state ownership, `useState` vs. `useReducer`, prop drilling vs. Context, or something else) that you're not 100% sure was the right call. Explain the trade-off honestly, both directions.
- [ ] Across Exercises 3–5, name one bug category from the *original* vanilla app (Exercise 1's defect list) that is now, by construction, no longer possible in your React version — not just fixed, but structurally prevented. Explain why the React architecture rules it out.

---
