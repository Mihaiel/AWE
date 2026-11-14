# Exercise 4 — React UI & Component Design

This is the fourth exercise in Advanced Web Engineering Course (CSDC). It builds on Exercise 3. This exercise migrates **two more views — People & Locations, and Timeline** — bringing the running total to 3 of the app's 5 views fully in React. **Evidence Catalogue and Workspace are deliberately not part of this exercise**. They need real interactivity (`useState`, controlled forms, a reducer) to make sense, and that's Exercise 5.

**This exercise is about structure, not behavior.** Migrate these views as presentational-first, e.g.
reusable components, typed props, lists and conditional content, and (for Timeline) filter controls that are visually complete but not required to be functionally wired to `onChange` handlers yet. "No state management beyond what is necessary to render the initial view" is the rule. It's fine (expected, even) for Timeline's filter dropdowns to not filter anything yet when changed by the user.

**Hard rules for every component you write in this exercise:**
- [ ] No `innerHTML`.
- [ ] No manual DOM creation (`document.createElement`, `.appendChild`, etc.).
- [ ] No state beyond what's needed to render the initial view (reading a query param once to decide *what* to show initially is fine.

**Out of scope for this exercise**: Evidence Catalogue, Workspace, `useState` and any interactivity beyond what's needed to render the initial view, forms that actually submit
or validate anything, global/shared state, and accessibility (not covered in this course). 

## Corresponding manuscript reading

This exercise corresponds to the following chapters in the course manuscript:

- **Chapter 15, React Foundations** — “JSX is JavaScript syntax for UI descriptions” through “The component tree,” PDF pp. 104–106
- **Chapter 16, React Component Design and Routing** — all sections, PDF pp. 110–114

## Self-Check

The exercise is organized into 10 individual tasks with corresponding questions, that are presented in class. 

These checkboxes are for self-checking. Don't forget to do the actual checking of tasks you are able to present in the Moodle course. **Before class, tick only what you can genuinely demonstrate or answer on the spot, live.**

| # | Demo | Ready? |
|---|---|---|
| 1 | JSX, function components, typed props, composition & children | ☐ |
| 2 | Conditional rendering | ☐ |
| 3 | Rendering collections | ☐ |
| 4 | Stable keys and list identity | ☐ |
| 5 | Presentational vs. feature components and component boundaries | ☐ |
| 6 | Feature-oriented folder structure | ☐ |
| 7 | Reusable UI elements | ☐ |
| 8 | Routing: People & Locations as real routes | ☐ |
| 9 | Route parameters | ☐ |
| 10 | Query parameters as URL state + migration wrap-up | ☐ |

---

## Demo 1 — JSX, function components, typed props, composition & children

**Tasks**

- [x] Build at least 3 small components for the People & Locations or Timeline views using JSX, each with an explicitly typed props interface/type (no untyped or `any` props).

      Built `PersonCard` ([js/react/components/PersonCard.tsx](js/react/components/PersonCard.tsx), prop `person: Person`), `LocationCard` ([js/react/components/LocationCard.tsx](js/react/components/LocationCard.tsx), prop `location: Location`), and `Panel` (below). `Person`/`Location` are Exercise 2's own domain types from [js/types.ts](js/types.ts), reused, not redefined. [js/react/pages/PeoplePage.tsx](js/react/pages/PeoplePage.tsx) now fetches real `people.json`/`locations.json` and renders both lists, no tab toggle yet, that's Demo 2's job.

- [x] Build at least one component that takes `children` (composition) rather than a data prop, and use it in a real place in the app (e.g. a generic card/panel wrapper).

      Built `Panel` ([js/react/components/Panel.tsx](js/react/components/Panel.tsx)): a `title` prop plus `children`, reusing the existing `.dashboard-panel` CSS class from Exercise 3. Used twice for real in `PeoplePage.tsx`, once wrapping the mapped `PersonCard`s, once wrapping the mapped `LocationCard`s.

**Questions** (depend on the tasks above)

- [x] Show one JSX expression in your code that embeds a JavaScript value or expression (not just static markup). For example `{person.name}` or a computed value. What can and can't go inside `{...}` in JSX?

      [js/react/components/PersonCard.tsx:19](js/react/components/PersonCard.tsx:19): `<h3>{person.name}</h3>`. `{...}` can hold any JavaScript *expression* that evaluates to something renderable (a variable, a function call, a ternary, a `.map()`), it can't hold statements like `if`/`for`, those have to happen before the `return`, not inside the JSX itself.

- [x] For one component's typed props: what would TypeScript catch if you passed the wrong shape of data to it? Demonstrate a real type error by passing something wrong on purpose.

      Changed `<PersonCard key={person.id} person={person} />` to `person={data.locations[0]!}` on purpose in `PeoplePage.tsx`, then ran `npm run typecheck`:

      ```
      js/react/pages/PeoplePage.tsx(54,39): error TS2740: Type 'Location' is missing the following properties from type 'Person': role, speciality, responsibilities, statement, and 2 more.
      ```

      Reverted immediately after capturing it. `PersonCard`'s `person: Person` prop type is what caught this, a `Location` object genuinely is missing fields `Person` requires.

- [x] What's the difference between passing data as a named prop versus passing it as `children`? Why did you choose `children` for the component you built with it?

      A named prop is for simple fixed-shape data (`Panel`'s `title: string`). `children` is for random, arbitrary, structured JSX a caller composes, exactly `Panel`'s content: a list of `PersonCard`s in one place, a list of `LocationCard`s in another. 
      
      Forcing that through a single named prop would mean passing pre-built JSX as a value anyway, `children` is literally what JSX already has for "whatever's nested inside this tag."

- [x] Why does direct DOM manipulation (as the old vanilla `app.js` did constantly, e.g. `innerHTML`, `classList.add/remove`, manually building elements) conflict with React's rendering model? What assumption does React make about who "owns" the DOM that direct manipulation breaks?

      As learned in the Skriptum, after adding react-root we should not change anything manually and let react change and update UI based off the state implicitly. 
      
      React assumes it's the only thing that ever touches the real DOM inside a component it's rendering, it keeps its own record of what it last rendered to diff against. Direct manipulation (vanilla's `container.innerHTML = html`, `classList.add/remove`) changes the real DOM behind React's back, so on the next render React's internal record no longer matches reality, and it can silently overwrite the manual change, or get confused about what actually needs updating.

---

## Demo 2 — Conditional rendering

**Tasks**

- [x] Implement at least two real conditional-rendering cases in the views you're migrating. For example: an empty state (e.g. "no timeline events match" if applicable), and a state-dependent style/label (e.g. the active People/Locations tab, or a certainty badge's variant on a timeline event).

    Case 1, the active People/Locations tab: [js/react/pages/PeoplePage.tsx](js/react/pages/PeoplePage.tsx) now has real `activeTab` state and a ternary picking which `Panel` (People or Locations) renders, plus a conditional className on each tab button.
      
    Case 2, timeline certainty badge variant: [js/react/components/CertaintyBadge.tsx](js/react/components/CertaintyBadge.tsx) picks the badge's CSS class from `certainty` via the existing `certaintyBadgeClass()` lookup function from `js/utils.ts`. Also added a timeline empty-state check in [js/react/pages/TimelinePage.tsx](js/react/pages/TimelinePage.tsx), genuinely real code, just not reachable right now since the dataset always has 15 entries and filters aren't wired yet.

- [x] Use at least two different conditional-rendering techniques (e.g. a ternary, `&&`, early-return, or a lookup/mapping function) and be ready to justify which you used where.

    Four, across the two cases: a ternary for which People/Locations panel renders (exactly two mutually-exclusive outcomes, a ternary fits that shape directly);
      
    `&&` for the timeline empty state (nothing to render in the common case, no "else" branch needed); 
       
    a lookup/mapping function (`certaintyBadgeClass()`) for picking the badge's CSS class, reused rather than written as a new if/else chain
       
    and early-return in `CertaintyBadge` (`if (!certainty) return null`), the cleanest way to say "render nothing at all" for one specific case without wrapping the rest of the component in an `if`.

**Questions** (depend on the tasks above)

- [x] Show one place where you used `condition && <Component />}` instead of a ternary. What would go wrong if `condition` were a number like `0` instead of a boolean and does that risk apply to your actual code?

    [js/react/pages/TimelinePage.tsx:40](js/react/pages/TimelinePage.tsx:40): `{events.length === 0 && <p>...</p>}`. If `condition` were `0` itself (not a boolean expression that evaluates to a number), React would render the literal text "0" onto the page, since `0 && anything` evaluates to `0`, and `0` is a valid, renderable JSX child. My actual code is safe: `events.length === 0` is a comparison, so it always evaluates to a real boolean, never the raw number itself.

- [x] Why might returning `null` from a component be preferable to returning an empty `<div>` in some cases? Did you use either, and why?

      An empty div still creates a real DOM node, taking up a slot in the tree (and, depending on CSS, potentially occupying space or affecting layout) for something with nothing to show
      
      `return null` renders nothing at all, no DOM node exists. Used it in `CertaintyBadge`: if there's no certainty value, an empty `<span className="badge ...">` would still show as a tiny empty pill in the UI, `null` means nothing renders there at all.

---

## Demo 3 — Rendering collections

**Tasks**

- [x] Render the people list, the locations list, and the timeline events list, each as a mapped collection of components, each with a proper `key` prop.

      Already in place from Demos 1–2, no new components needed: [js/react/pages/PeoplePage.tsx:77](js/react/pages/PeoplePage.tsx:77) (`<PersonCard key={person.id} .../>`), [js/react/pages/PeoplePage.tsx:83](js/react/pages/PeoplePage.tsx:83) (`<LocationCard key={location.id} .../>`), and [js/react/pages/TimelinePage.tsx:42](js/react/pages/TimelinePage.tsx:42) (`<TimelineEventItem key={event.id} .../>`). All three keys are the real id from the underlying data, not the array index.

**Questions** (depend on the tasks above)

- [x] What does React actually use `key` for internally?

      React's reconciler matches each rendered element to the corresponding one from the previous render by its `key`, not by its position in the array. 
      
      That's what lets it tell "this is the same item, just moved or updated" apart from "this is a new item" or "this one was removed", so it can reuse the existing DOM node and component instance (and whatever state lives in it) instead of destroying and recreating it, and only patch what actually changed.

---

## Demo 4 — Stable keys and list identity

**Tasks**

- [x] Deliberately use `key={index}` in one throwaway example, then demonstrate (e.g. by reordering or filtering the underlying array) a case where it produces a visibly wrong result, before replacing it with a real stable id.

      Built a file  js/react/components/KeyDemoThrowaway.tsx : three suspects, each row with its own local `useState` checkbox, mapped with `key={index}`. Checked Alice's box (first row), clicked a "Remove first suspect" button, and the checkbox stayed checked, now on Bob, who was never clicked, confirmed live in the browser. Switching the key to the suspect's own stable `id` and repeating the exact same steps fixes it, Alice's checked state correctly disappears along with her instead.

      Not part of the real app (presentational-only, and this exercise's own scope rules out this kind of interactivity), so it's wired into [js/react/App.tsx](js/react/App.tsx) commented out rather than deleted, since it needs to be shown live: both the import and the `<KeyDemoThrowaway />` line are ready to uncomment for class, same bug reproduces immediately when toggled on, confirmed again after committing it this way. Commented back out before committing, `react.html` is unaffected by default, `npm run build` output is unchanged.

**Questions** (depend on the tasks above)

- [x] What goes wrong, concretely, when keys are missing, duplicated, or based on array index for a list that can reorder or filter?

      No key at all: React silently falls back to each item's render position anyway, same identity problem as `key={index}`, plus a console warning.
      
       Duplicate keys: React can't tell the colliding items apart, so it may reuse or drop the wrong one and warns in the console. Index-based keys on a list that can reorder or filter: exactly what the task above demonstrated, a checkbox's checked state stayed attached to position 0 instead of following the suspect it actually belonged to.

- [x] The *original* vanilla version of this app had a real bug where one feature used an array index as an identifier instead of a stable id. Would that same mistake, ported directly into React as `key={index}`, have caused a symptom a user could notice, or only a console warning? Explain why.

      Found it in [js/views/workspace.ts](js/views/workspace.ts)'s `renderNotesList()`: `noteEntries` stores `index: i`, `i`'s position in `state.allEvidence`, not the position within the rendered `noteEntries` list itself, then builds `id="noteText-${entry.index}"` from it. Right now this causes neither: confirmed with `grep -rn "noteText" js/ index.html` that nothing in the app ever reads that id back, and `state.allEvidence`'s own order never changes at runtime, so the id is dead weight but harmless.

      Ported directly into React as `key={index}` over `noteEntries.map()` (index would naturally become the render position within `noteEntries`), it becomes exactly my demo's bug in disguise: adding a note to an evidence item earlier in `allEvidence`'s order shifts every later note down a `noteEntries` position, and React would reuse each shifted row's old state for whatever entry now lands there. Still no *visible* symptom today, for the same reason as the vanilla version, this list has no interactive per-row state yet. It would turn into a real, user-visible bug the moment a stateful feature got attached to each row, exactly the line between this exercise's presentational-only scope and Exercise 5's interactivity.

- [x] All of this app's real data (people, locations, timeline events) already has stable ids. Is there ever a legitimate reason to use `key={index}` anyway? When?

      Yes: a list that's rendered once, never reordered, filtered, or grown at runtime, and whose items hold no per-item local state, nothing can ever get misattached because there's nothing to lose track of. 
      
      None of this app's real lists qualify (all three come from fetched JSON that could in principle change). A genuine example would be a fixed, hardcoded array defined directly in the component itself, e.g. calendar weekday headers (`["Mon", "Tue", ...]`), permanent, in that exact order, forever.

---

## Demo 5 — Presentational vs. feature components and component boundaries

**Tasks**

- [x] Classify every component you've built so far as either "presentational" or "feature/container". Explain why.

    Presentational components are those whose job is only to render a view according to the props that are passed to it, aka their only concern is with displaying some content.
    1. [PersonCard](js/react/components/PersonCard.tsx)
    2. [LocationCard](js/react/components/LocationCard.tsx)
    3. [Panel](js/react/components/Panel.tsx)
    4. [CertaintyBadge](js/react/components/CertaintyBadge.tsx)
    5. [TimelineEventItem](js/react/components/TimelineEventItem.tsx)
    6. [CaseSummaryCard](js/react/components/CaseSummaryCard.tsx)
    7. [StatCard](js/react/components/StatCard.tsx)
    8. [ReviewProgressBar](js/react/components/ReviewProgressBar.tsx)
    9. [MiniListItem](js/react/components/MiniListItem.tsx)
    10. [NavBar](js/react/components/NavBar.tsx) (only calls back `onNavigate`, doesn't decide the view itself), [Header](js/react/components/Header.tsx), and the new [TabBar](js/react/components/TabBar.tsx) below.

    Feature/container - fetch their own data and/or own state that decides what gets rendered: 
    1. [App](js/react/App.tsx) (owns `currentView`, decides which page mounts)
    2. [DashboardPage](js/react/pages/DashboardPage.tsx)
    3. [PeoplePage](js/react/pages/PeoplePage.tsx) (fetches data, owns `activeTab`)
    4. [TimelinePage](js/react/pages/TimelinePage.tsx) (fetches data). `EvidencePage`/`WorkspacePage` are still Exercise 3 stubs, out of scope this exercise, not really classifiable yet either way. (Not counting [KeyDemoThrowaway](js/react/components/KeyDemoThrowaway.tsx), Demo 4's live-demo-only scratch component, it's not part of the real app.)

- [x] Find at least one component that's currently doing more than one job, and split it into two components with a clear boundary between them.

      `PeoplePage` was doing this: fetching data and owning `activeTab` (a feature job) *and* hand-building the tab-bar's markup and active-class logic (a presentational job), in one file. Split the second job out into [TabBar.tsx](js/react/components/TabBar.tsx), a generic `tabs`/`activeTab`/`onChange` component that only knows how to render a row of tab buttons. `PeoplePage` now just decides what the tabs are (`[{value: "people", ...}, {value: "locations", ...}]`) and passes them down.

**Questions** (depend on the tasks above)

- [x] For the component you split: what was the single responsibility of each half after the split? If an implementation detail in one half changed, would that change affect the other half? Why or why not?

      `TabBar`'s only job: turn a `tabs`/`activeTab`/`onChange` into buttons, with the right one marked `.active`. `PeoplePage`'s only job (for this part): decide what the tabs are and own which one is active. If `TabBar` changed how it marks the active button internally (e.g. swapped the string-concatenation class name for a `classList`-style array join), `PeoplePage` wouldn't need any change at all, it only ever passes `tabs`/`activeTab`/`onChange` in and never looks at `TabBar`'s internals. The reverse holds too: `PeoplePage` could add a third tab, change its labels, or swap `activeTab`'s type entirely, and `TabBar` wouldn't need to change, it just renders whatever `tabs` array it's handed.

- [x] Give one concrete rule you used to decide "this belongs in a presentational component" versus "this belongs in a feature component."

      If deleting all of a component's props would leave it with nothing to render (because it never fetches or looks anything up on its own), it's presentational. If it would still render *something* because it has its own `useState`/`useEffect`/data source feeding it, it's feature/container.

---

## Demo 6 — Feature-oriented folder structure

**Tasks**

- [x] Reorganize your React source into a feature-oriented structure (e.g. grouping by
`people-locations/`, `timeline/`, `dashboard/`, shared `components/`, rather than one flat
folder of files). Including the Dashboard and shell from Exercise 3.

- [x] Document the structure you landed on (a short `ARCHITECTURE.md` section or README snippet is enough) and the rule you used to decide what's "shared" versus "feature-local."

      [ARCHITECTURE.md](ARCHITECTURE.md).

**Questions** (depend on the tasks above)

- [x] What's the difference between organizing files "by type" (all components in one folder, all hooks in another) and "by feature"? What made you choose the structure you chose for this app specifically?

      By type means every file about People & Locations is scattered across `components/`, `pages/`, etc, alongside unrelated files from Timeline and Dashboard, grouped by what kind of file it is, not by what it's for. By feature, everything one view actually needs sits together in one folder. 
      
      Chose by-feature here because this app's own migration is already happening one view at a time (Dashboard in Exercise 3, People & Locations and Timeline this exercise), by-feature folders make that boundary visible in the file tree itself, and it's obvious where the next migrated view's files should go. -> Pretty much every feature is grouped in their own folder (shell, people-locations, timeline, workspace)

- [x] Where did you draw the line between a component that lives inside one feature folder and one that belongs in a shared/common folder? Give one real example of each from your own structure.

      The rule (full reasoning in [ARCHITECTURE.md](ARCHITECTURE.md)): shared if it takes only generic props and carries no domain type or feature-specific vocabulary, feature-local otherwise, regardless of how many places currently import it.

      Feature-local example: [CertaintyBadge](js/react/timeline/CertaintyBadge.tsx), it renders this app's own timeline-specific "certainty" vocabulary (`certaintyBadgeClass()`), meaningless outside Timeline even though its prop is just a `string`. Shared example: [TabBar](js/react/components/TabBar.tsx), generic `tabs`/`activeTab`/`onChange`, no domain type, even though today only `PeoplePage` actually uses it.

---

## Demo 7 — Reusable UI elements

**Tasks**

- [ ] Extract at least one presentational component that is genuinely reused in **two or more different places** in the app (e.g. a badge, a card shell, a button variant), with a typed props API that makes it flexible enough for both uses without becoming a special-cased mess.

**Questions** (depend on the tasks above)

- [ ] Show the two (or more) places your reusable component is used. What varies between them via props, and what stays fixed inside the component itself? How did you decide where that line goes?
- [ ] The original vanilla app had duplicated HTML-template code (the same card markup written out twice, slightly differently, in two functions). Compare that directly to what you just built. What does a reusable component give you that copy-pasted template strings didn't?

---

## Demo 8 — Routing: People & Locations as real routes

**Tasks**

- [ ] Install a routing library (React Router or an equivalent of your choice, justified) and
replace the shell's placeholder navigation from Exercise 3 with real routes for at least Dashboard, People & Locations, and Timeline.
- [ ] Convert the People/Locations tab toggle from local component state into two real,
navigable, bookmarkable routes (e.g. `/team/people` and `/team/locations`) instead of a click handler that only changes what's shown without changing the URL.

**Questions** (depend on the tasks above)

- [ ] Why does making the People/Locations tab a real route (versus keeping it as internal
component state) matter for the user? Name a concrete capability the user gains.
- [ ] What does your router do when the URL doesn't match any route you've defined? Compare this to how the vanilla app's `handleHashChange()` fell back to the dashboard for an invalid hash.

---

## Demo 9 — Route parameters

**Tasks**

- [ ] Add at least one route that takes a parameter (e.g. a person or location id in the URL, such as `/team/people/:personId`), and use that parameter inside the corresponding component to determine what to render.
- [ ] Make at least one place in the app link to that parameterized route (not just typing the URL by hand). For example, a person's name in a related-evidence context, or a "view on team page" link.

**Questions** (depend on the tasks above)

- [ ] How do you read a route parameter's value inside your component, and what type is it as far as TypeScript is concerned by default? What did you have to do to use it safely (e.g. what if the id in the URL doesn't match any real person)?
- [ ] What's the practical difference, for the user, between `/team/people/nova-byte` (a route
param) and `/team/people?person=nova-byte` (a query param)? Why is one more appropriate than
the other for this specific case?

---

## Demo 10 — Query parameters as URL state + migration wrap-up

**Tasks**

- [ ] On the Timeline view, read a query parameter (e.g. `?person=...`) when the page loads, and use it to determine the *initial* rendered list (for example, pre-selecting a person filter if the app is opened via a link that includes one). Remember, the filter controls themselves don't need to be interactive yet. This is about parameterizing the initial render from the URL, not wiring `onChange`.
- [ ] Do a final pass confirming: Dashboard, People & Locations, and Timeline are fully React, none of them use `innerHTML` or manual DOM creation anywhere, and all three are reachable via real, bookmarkable routes.

**Questions** (depend on the tasks above)

- [ ] Why is reading a query parameter once, on initial render, still consistent with this exercise's "no state beyond what's necessary to render the initial view" rule? What would cross the line into "real interactivity" that's out of scope until Exercise 5?
- [ ] What would you need to add to make Timeline's filters *actually* filter the list when a user changes them? (You don't have to build it. Just name the concept you'd need)
- [ ] Across the 3 views you've now fully migrated, what's one piece of duplicated logic or markup you noticed but didn't extract yet? Why didn't you, and would you if you had more time?

---
