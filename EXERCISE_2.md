# Exercise 2 — Build Tooling, TypeScript & CI/CD

This is the second exercise in Advanced Web Engineering Course (CSDC). It builds directly on
**Exercise 1**, you need the ES-module split from that exercise finished first, since this exercise migrates those modules to TypeScript and puts them through a real build pipeline.

By the end of this exercise the project will: be managed by a package manager instead of a plain
`<script>` tag, run through Vite for both development and production builds, be written in
TypeScript instead of JavaScript, and be linted, formatted, and deployed automatically by GitHub
Actions whenever code is pushed.

**Out of scope for this exercise** (these come later in the course): migrating to a framework (e.g.
React)

Keep a running note of what you changed and why. As in Exercise 1, **commits are the easiest way to
demonstrate a before/after live**, e.g. "workflow fails here, passes after this commit," or "this
compiled fine in JS, here's the TypeScript error it produces and the fix."

## Corresponding manuscript reading

This exercise corresponds to the following chapters in the course manuscript:

- **Chapter 7, The Build First Mindset** — PDF pp. 55–57
- **Chapter 8, Dependencies, Package Managers, and Vite** — PDF pp. 58–62
- **Chapter 9, Linting, Formatting, and Asset Processing** — PDF pp. 63–66
- **Chapter 10, TypeScript: Static Types for JavaScript** — PDF pp. 67–78
- **Chapter 11, Continuous Integration and Automated Deployment** — PDF pp. 80–83

## Self-Check

The exercise is organized into 10 individual tasks with corresponding questions, that are
presented in class.

These checkboxes are for self-checking. Don't forget to do the actual checking of tasks you are able to present in the Moodle course. **Before class, tick only what you can genuinely demonstrate
or answer on the spot, live.**

| # | Demo | Ready? |
|---|---|---|
| 1 | Initialize the package manager & project metadata | ☑ |
| 2 | Integrate Vite as the dev server | ☑ |
| 3 | Production build & preview | ☑ |
| 4 | `package.json` scripts: lint & format | ☑ |
| 5 | TypeScript setup & first conversions | ☑ |
| 6 | Typing the domain data | ☐ |
| 7 | Full migration & resolving type errors | ☐ |
| 8 | GitHub Actions: development workflow | ☐ |
| 9 | GitHub Actions: deployment workflow | ☐ |
| 10 | Workflow triggers, permissions & failure modes | ☐ |

A demo only counts as "Ready" once **every** task and question checkbox inside it (below) is
ticked. The table above is just a fast overview, tick the boxes inside each demo first.

---

## Demo 1 — Initialize the package manager & project metadata

**Tasks**

- [x] Choose **npm** or **pnpm** and record why you picked it over the other.

      Chose npm. I already know it and I'm familiar with it, that's the whole reason, not some deep technical comparison against pnpm. It comes bundled with Node, so there's nothing extra to install, and every command I'd need (`npm install`, `npm run ...`) is already muscle memory.

- [x] Initialize `package.json` for the project (name, version, description, etc. filled in properly).

      Ran `npm init -y` then filled in the fields that actually matter instead of leaving the generated defaults: `name` is `remotion-investigation-portal` (the folder name has spaces in it, which isn't a valid npm package name), `version` starts at `0.1.0` since this is mid-course work in progress, a real `description` pulled from what the app actually does, `"private": true` since this is never getting published to the npm registry, and `"type": "module"` since the app and any future build config are ESM throughout.

- [x] Add a `.gitignore` entry for `node_modules` (and any other tool output you generate in later demos, e.g. `dist/`).

      Added both `node_modules` and `dist` (`dist` now since Demo 3 will need it).

- [x] Install one real dependency (you'll add more in later demos) and show the resulting lockfile (`package-lock.json` or `pnpm-lock.yaml`) committed to the repo.

      Installed `date-fns` a small, genuinely useful date-formatting library, picked because it actually lines up with the ad-hoc `formatDate()` helper already sitting in `utils.js`, not a throwaway pick just to satisfy this checkbox. `package-lock.json` got generated automatically and sits right next to `package.json`, both staged to commit together. 
      `esbuild` as well because I used it in the past.

      Didn't import `date-fns` into any app code yet on purpose, the app still runs as a plain `<script type="module">` with no bundler, and a browser can't resolve `import { format } from "date-fns"` from `node_modules` without one, that only becomes possible once Vite exists starting Demo 2.

**Questions** (depend on the tasks above)

- [x] What problem does a package manager actually solve that "download the library and put it in a folder yourself" doesn't? Be specific.

      Manually downloading a library doesn't track what version you have, doesn't know what that library itself depends on (and those dependencies have their own dependencies), and gives you no repeatable way to reconstruct the exact same set of files on a teammate's machine or in CI. `npm install esbuild` resolved one package but actually pulled in exactly what's declared in its own `package.json`, recorded the exact resolved version and integrity hash in the lockfile, and gives anyone who clones this repo a single command (`npm install`) that reproduces precisely the same `node_modules` tree. Doing that by hand for even a handful of real dependencies with their own sub-dependencies isn't realistically something you'd get right, or keep right as versions move.

- [x] What's the difference between `dependencies` and `devDependencies` in `package.json`? Which
      category will Vite, your linter/formatter, and TypeScript belong to, and why?

      `dependencies` are packages the shipped app actually needs at runtime, code that ends up genuinely executing for a real user. `devDependencies` are packages only needed while building or working on the project, never shipped to a user's browser. `date-fns`, the one dependency installed in this demo, is a `dependency` since I'm planning on actually calling its functions from code that runs in the browser. Vite, the linter, the formatter, and TypeScript are all going to be `devDependencies`, none of them ship to the browser, Vite and TypeScript's whole job is to produce the final plain JS/HTML/CSS *before* a user ever sees it, and the linter/formatter only ever run against source code on a developer's or CI's machine.

- [x] What is a lockfile for, and what could go wrong for your teammates (or CI) if it weren't
      committed to the repo?

      `package.json`'s version ranges (`^4.4.0`) describe a *range* of acceptable versions, not one exact version, `package-lock.json` pins the *exact* version (and exact version of every nested dependency) that was actually resolved and installed. Without it committed, a teammate running `npm install` next week, or a CI machine running it next month, could get a newer version within that same range, one that behaves subtly differently or outright breaks something, with no way to know that's *why* it broke, since their `package.json` looks identical to mine. The lockfile is what makes "works on my machine" actually mean "works on every machine," by removing that ambiguity entirely.

- [x] If you chose pnpm: what does it do differently from npm regarding how `node_modules` is laid out and how disk space/install time is shared across projects? If you chose npm: what would you gain or lose by switching to pnpm on a larger project?

      I chose npm, so: pnpm keeps one single global content-addressable store of every package version on disk, and every project's `node_modules` is filled with hard links (or similar) pointing back into that shared store instead of each project getting its own full physical copy.

---

## Demo 2 — Integrate Vite as the dev server

**Tasks**

- [x] Install Vite and configure it for this project (restructure files if needed so Vite can find `index.html`/your modules/the `data/` and `assets/` folders correctly).

      Installed Vite as a devDependency (`npm install --save-dev vite`). `index.html`, `js/`, and `styles.css` needed no changes at all, they were already at the project root using relative paths (Vite default settings). `data/` and `assets/` did need to move though, both get reached by a plain runtime URL (`fetch("data/evidence.json")`, `<img src="assets/logo/logo.svg">`), not by an `import`, and Vite only serves (and later copies into `dist/`) files like that as-is if they live under `public/`. 
  
      The recommendation was to move both with `git mv` so the history stays a rename instead of a delete+add, into `public/data/` and `public/assets/`.

- [x] Get `vite`'s dev server running the app with the same functionality it had before. Verify every view still works, not just that the page loads.

      Added a `"dev": "vite"` script which can be ran with `npm run dev`.
  
      Checked the Network tab first, `/assets/logo/logo.svg` and all five `/data/*.json` files came back 200 straight from `public/`, confirming the restructure actually worked and not just that the page loaded. Then clicked through all five views.
   
      Dashboard (stats + recent panels), Evidence (list, a detail view, editing its status select), People & Locations (both tabs, including the portrait images), Timeline, and Workspace (bookmarks/notes/hypothesis form), all identical to how they worked on the plain static server.

- [x] Trigger Hot Module Replacement at least once: change something in the running app's source and observe the update happen without a full page reload.

      Typed a search term into the Evidence search box first, so I'd have some obvious in-memory state to watch. Edited `styles.css` (changed the header's background to a solid color) while the dev server was running: the header color changed instantly, and the search box still had my typed text in it, filters still applied, nav still on Evidence. Confirmed in the console too: `[vite] css hot updated: /styles.css`, no new `connecting...`/`connected.` pair, meaning no reload happened at all. Reverted the CSS change right after.

**Questions** (depend on the tasks above)

- [x] What is the difference between how you used to run this app (a plain static file server) and running it through Vite's dev server? Name at least one thing Vite's dev server does that a plain static server doesn't.

      A plain static server (`python -m http.server`, or the `http.server` one I'd been using throughout Exercise 1) does exactly one thing: it reads a file off disk and sends its bytes back, unmodified, for whatever path you request. 
  
      Vite's dev server does that too for anything under `public/`, but for everything else it's actually running a transform pipeline, it injects a small HMR client script (Hot module replacement) into `index.html` on the fly, serves the JS/CSS through its own module-aware middleware instead of handing back the literal file, and watches your source files so it can push updates to the browser over a WebSocket the instant something changes. This doesn't exist in a plain static server which would need refreshes.

- [x] What is Hot Module Replacement, and what specifically did you observe happen (and *not* happen, e.g. to app state) when you triggered it?

      HMR is Vite's dev server pushing just the changed component to the already-running page over that WebSocket connection, and swapping it in place, instead of reloading the whole page from scratch. What I actually observed: editing `styles.css` hot-swapped the stylesheet with the typed search text, the active filters, and the current view all still intact, nothing about the running app's JS state was touched. I tried with JS as well but this didn't work and after a quick search that's how it's supossed to be.


- [x] Why does an app already split into ES modules (Exercise 1) integrate naturally with a tool like Vite, compared to the original single-`<script>` version?

      Vite's entire dev-server model is built around the browser's native ES module loader, it serves your actual `import`/`export` source files directly (through its transform middleware) and lets the browser resolve the `import` graph itself, rather than needing to bundle everything into one file before anything can run. The original single 1085-line `app.js` from before Exercise 1 had no `import`/`export` statements at all, there was no module graph for Vite to even hook into, it would've just been one opaque script Vite could serve but couldn't meaningfully apply per-module HMR to. Because Exercise 1 already split this into eleven real ES modules with explicit imports between them, Vite could slot in underneath with zero restructuring of the JS itself, each file is already its own addressable module.

---

## Demo 3 — Production build & preview

**Tasks**

- [x] Run the production build (`vite build`) and inspect the generated `dist/` folder.

      `npm run build`

      Added `"build": "vite build"` to `package.json` and ran it: `15 modules transformed`, output was `dist/index.html` (10.52 kB), `dist/assets/index-B_6IgYD9.js` (23.29 kB, gzip 6.26 kB), and `dist/assets/index-ZAWMSz9M.css` (11.44 kB, gzip 2.77 kB), plus `dist/data/*.json` and `dist/assets/logo/`/`dist/assets/people/*` copied over unchanged from `public/`. All eleven `js/` source files became exactly one JS file, all of `styles.css` became exactly one CSS file, both with a content hash in the filename, the stuff that lived in `public/` came through completely untouched, same filenames, no hash.

- [x] Serve that build locally with `vite preview` (not the dev server) and confirm the app still works end-to-end from the built output.

      `npm run preview`

      Added `"preview": "vite preview"` to the central `package.json` and ran it. Console had no `[vite] connecting...` messages this time (no HMR client in a production build, confirming it really is a different thing from `vite dev`). 
      
      Checked the Network tab and the hashed `/assets/index-B_6IgYD9.js`, `/assets/index-ZAWMSz9M.css`, `/assets/logo/logo.svg`, and all five `/data/*.json` arrived correctly. Everything behaved identically to the dev server and the original static-file version.

- [x] Compare the dev-mode source with the built output for at least one file: note what changed (filenames, size, formatting/minification).

      Compared `styles.css` (14,534 bytes, dev) against `dist/assets/index-ZAWMSz9M.css` (11,442 bytes, built). The filename changed completely, from a plain name to `index-<8-char-hash>.css`. The leading `/* Project ReMotion - Investigation Portal styles */` comment is gone entirely. Every rule got squashed onto effectively one line, no newlines or indentation left. `#ffffff` became the shorthand `#fff`. Same CSS rules, same selectors, same cascade, just about 21% smaller and completely unreadable by a human now.

**Questions** (depend on the tasks above)

- [x] Name at least three concrete transformations Vite applied to your source when building for production (e.g. bundling, minification, hashed filenames. Pick the ones you actually observed).

      Bundling: all eleven separate `js/*.js` / `js/views/*.js` files (48,435 bytes combined) became exactly one `index-B_6IgYD9.js` (23,291 bytes), one network request instead of eleven. Minification: the bundled JS has single-letter variable names, no whitespace, and the CSS lost its comment and all its formatting, the same transformation I saw on the CSS file directly above. Hashed filenames: both `index-B_6IgYD9.js` and `index-ZAWMSz9M.css` have an 8-character content hash baked into the name, neither exists anywhere in the source. A fourth one I also noticed: `index.html` itself got rewritten, its `<script>`/`<link>` tags now point at those exact hashed filenames instead of the original `js/main.js`/`styles.css` paths.

- [x] Why do production filenames typically include a content hash? What problem does that solve for real deployments?

      The hash is a hash of the file's contents, so it only changes when the actual bytes change. That means you can tell browsers (and CDNs, and any intermediate cache) to cache `index-B_6IgYD9.js` forever, aggressively, since the moment the code actually changes, the build produces a differently named file, `index-<new-hash>.js`, there's no way for a stale cached copy under the old name to ever get served for the new code.

- [x] Why would you never want to deploy the dev server itself (`vite dev`/`vite`) to real users, even though it "works"?

      The dev server serves the source files mostly as-is, unbundled (eleven separate JS requests instead of one), unminified (full variable names, all the comments I wrote throughout Exercise 1 still in there, readable by anyone who opens devtools), and it injects a WebSocket-connected HMR client into every page load whose entire job is to listen for file-change events that will simply never come from a real user.

---

## Demo 4 — `package.json` scripts: lint & format

**Tasks**

- [x] Install and configure a linter (e.g. ESLint) and a formatter (e.g. Prettier) for this TypeScript/JS project.

      `npm install --save-dev eslint @eslint/js globals`

      Installed ESLint with a flat `eslint.config.js`: `js.configs.recommended` plus a browser globals set (`window`, `document`, `fetch`, `localStorage`, ...) from the `globals` package, since this is a pure client-side app with zero Node-side code, ESLint assumes Node by default otherwise. `dist/`, `node_modules/`, and `public/` are excluded. 
      
      Installed Prettier too, with one deliberate override in `.prettierrc.json`, `printWidth: 100` instead of the default 80, since a lot of this codebase's HTML-string-building lines are naturally a bit long, and the default would have caused constant unnecessary rewrapping. `.prettierignore` excludes `node_modules`, `dist`, `public`, `package-lock.json`, and `*.md` (the running-notes docs are prose, not code, I didn't want Prettier reformatting those).

- [x] Add these scripts to `package.json`: `dev`, `build`, `lint`, `lint:fix`, `format`. Each one must actually do something real when run, not just print a placeholder.

      `npm run lint`
      `npm run format`

      `dev` and `build` already existed from Demos 2 and 3. I added `"lint": "eslint ."`, `"lint:fix": "eslint . --fix"`, and `"format": "prettier --write ."`.

- [x] Run `lint` and show it catching at least one real issue in your code (introduce one on purpose if you have to). Run `lint:fix` and/or `format` and show it actually changing a file.

      `npm run lint`

      const blabla = 3; -> lint should show that it's not used anywhere

      When working on the project i didn't need to introduce anything, `npm run lint` immediately caught 3 real `no-unused-vars` errors: `selectedEvidence` in `evidence.js`, `currentPeopleTab` in `people.js`. Ran `lint:fix` first, it left all three untouched, `no-unused-vars` has no autofixer (removing a declaration isn't something ESLint will do on its own). Fixed all three by hand instead, deleting the dead variable/parameter in each case, confirmed with a grep first that each was genuinely never read anywhere, then re-ran `lint`, clean. Then ran `format`, which did change files for real: 13 files got reformatted (long string-concatenation lines broken across multiple lines, trailing commas added, etc.), confirmed with `prettier --check .` first to see exactly which files it would touch before actually writing.

**Questions** (depend on the tasks above)

- [x] What's the difference between what a linter checks/fixes and what a formatter checks/fixes? Give one concrete finding from each tool on this codebase.

      A linter looks at what the code does, reachability, unused bindings, likely bugs, and can refuse to auto-fix things that need a real decision. A formatter only cares how the code *looks*, whitespace, line length, quote style, and will happily rewrite any of that without needing to understand the code's behavior at all. Concrete finding from each: ESLint's `no-unused-vars` catching the dead `resolvedTerm` parameter (a real, if minor, code-health issue, not a style issue), versus Prettier reflowing a long string-concatenation line in `dashboard.js` across several lines instead of one, purely cosmetic, the code did exactly the same thing either way.

- [x] Why are `lint` and `lint:fix` two separate scripts instead of one script that always auto-fixes? When would you deliberately want the non-fixing version?

      Because not every lint rule has a safe automatic fix, `no-unused-vars` is a perfect example from this very demo, ESLint can tell you a variable is dead but won't guess whether deleting it, renaming it, or actually wiring it up somewhere is the right call, that's a decision for a person. You'd deliberately want the plain `lint` (non-fixing) version anywhere you want to *see* the problems before anything changes, most obviously in CI (Demo 8), where you want the build to fail and show you exactly what's wrong, not silently rewrite a contributor's code and merge something they never actually reviewed.

- [x] What does `npm run lint` (or `pnpm lint`) actually do under the hood? Where does npm/pnpm look for the `lint` command, and would it work if your linter weren't installed as a project dependency (only globally on your machine)?

      `npm run lint` looks up the `"lint"` entry under `"scripts"` in `package.json`, and runs that exact string (`eslint .`) in a shell. The key mechanism: npm temporarily prepends this project's `node_modules/.bin` to the `PATH` for just that command, which is where the local `eslint` binary actually lives, that's how a bare `eslint .` resolves to this project's installed version instead of needing a full path. If ESLint weren't installed locally at all, `node_modules/.bin/eslint` simply wouldn't exist, but the shell would then fall through to whatever's on the normal system `PATH`, so it would still run *if* something global happened to be installed, just whatever version that happens to be, not the one pinned in `package.json`/the lockfile. 

---

## Demo 5 — TypeScript setup & first conversions

**Tasks**

- [x] Install TypeScript and add a `tsconfig.json`. Deliberately choose your strictness settings (don't just copy a default blindly) and be ready to justify at least one setting you turned on or left off.

      npm install --save-dev typescript

      Ran `npx tsc --init` first to get default file, then picked settings. Key settings: `strict: true`, `moduleResolution: "bundler"` (matches how Vite resolves modules), `noEmit: true` (Vite does the actual compiling, `tsc` is only ever a checker), `lib: ["ES2022", "DOM"]` (browser APIs, no Node code anywhere in this app).

       One setting turned off: `noUnusedLocals`/`noUnusedParameters`, since ESLint's `no-unused-vars` (Demo 4) already does that job so no reason for two tools to check the same thing.

- [x] Convert 2–3 of your smallest/utility modules from Exercise 1 (e.g. formatting or lookup helpers) from `.js` to `.ts`, with **no `any`**, and get them compiling with zero errors.

      Converted `state.js`, `utils.js`, and `storage.js` to `.ts`, the task's own "formatting or lookup helpers" suggestion, and they're tightly coupled enough (`utils.ts`/`storage.ts` both import `state`) that converting just one alone wouldn't have made sense. Typed the state arrays with a minimal `HasId { id: string }` interface rather than the full `Evidence`/`Person`/`Location` shapes, that's Demo 6's job on purpose. `npx tsc --noEmit`: zero errors, and `grep -n "\bany\b"` across all three files finds nothing but the word inside comments.

- [x] Wire TypeScript into your `build`/`dev` scripts from Demo 4 so type errors are actually surfaced by your tooling, not just by your editor.

      Inside the package.json

      Added `"typecheck": "tsc --noEmit"` and changed `"build"` to `"tsc --noEmit && vite build"`, the '&&' is used so when a type error happens, it blocks the production build entirely.
      
      Left `"dev"` as plain `vite`, on purpose: Vite's dev server doesn't type-check by default, and bolting that on would mean either a third-party plugin or a second concurrently-run process, more than this demo needs. `npm run typecheck` works fine run by hand alongside `npm run dev` in the meantime.

**Questions** (depend on the tasks above)

- [x] What does the `strict` option in `tsconfig.json` actually turn on? Name at least two individual checks bundled under it, and say whether you kept it on and why.

      `strict: true` isn't one check, it's a switch that turns on a whole group of them at once. Two examples: `noImplicitAny` (an untyped value becomes an error instead of silently being allowed as `any`) and `strictNullChecks` (`null`/`undefined` have to be explicitly allowed before you can use them, instead of sneaking in everywhere). Kept it on, mainly because this is a brand-new setup with only 3 files, so strict is cheap right now and gets more painful to add later. Also turned on `noUncheckedIndexedAccess`, a separate flag `strict` doesn't include, after testing it against my own code and seeing it catch a real bug (an unchecked array index in three lookup functions, see the first task).

- [x] What is the difference between a compile-time type error and the runtime bugs you fixed in Exercise 1? Could TypeScript alone have caught any of those specific bugs? Why or why not?

      A compile-time error is caught by `tsc` just reading the code, before it ever runs. A runtime bug only shows up once the code actually executes with real data, which is every bug from Exercise 1, since that app had no type checking at all. Mixed answer on whether TypeScript would've caught them: yes for the Demo 9 bug in Exercise 1 (forgetting an `await` left `state.allPeople` holding a Promise instead of the array)
      
       No for Demo 2's mutation bug (`filteredEvidence = allEvidence`, two names for one array), that's perfectly valid, type-correct code, TypeScript has no concept of "these shouldn't secretly be the same object." And also no for the localStorage-corruption crash, that's bad data at runtime not a compile-time thing.

- [x] What does `any` do to TypeScript's checking for a value, and why did you avoid it in this first pass even though it would have been faster to just silence the errors with it?

      `any` turns off type checking for that value completely, you can call anything on it, pass it anywhere, and TypeScript never complains. It's not "be careful, unknown type", it's "stop checking this." Avoided it because using `any` on the very first file defeats the point of converting it at all, a file full of `any` shows "zero errors" the same way deleting the code would, that's zero *checked* code, not zero real problems. The one tricky spot, `JSON.parse()`'s own return type is `any`, got handled with `unknown` plus a narrowing check instead, so the "this could be anything" stays visible rather than silently vanishing.

---

## Demo 6 — Typing the domain data

**Tasks**

- [x] Define TypeScript types/interfaces for the case's data model (evidence, people, locations, timeline events) that match the shape of `data/*.json`.

      Added `js/types.ts` with `Case`, `Person`, `Location`, `Evidence`, `TimelineEvent`, matching the actual fields in `data/*.json`. `status`/`relevance`/`type`/`certainty` stay `string`, not string-literal unions, because the real JSON isn't consistent enough for that (see task 3 below).

- [x] Convert your data-loading module to use these types instead of untyped `fetch().json()` results.

      Converted `dataLoader.js` to `dataLoader.ts`. Each `fetch().json()` result is typed `unknown` first, then asserted to the right domain type (`as Evidence[]`, `as Person[]`, etc.), same pattern as Demo 5's `storage.ts`. Also had to turn on `allowJs` in `tsconfig.json`: once `dataLoader.ts` imports the still-untyped `views/*.js` modules, `tsc` refused to resolve those imports at all without it. `checkJs` stays off, so those files aren't type-checked yet, that's Demo 7.

- [x] Pick one field that was genuinely ambiguous or inconsistent in the original JavaScript version and show what modeling it as a proper TypeScript type forced you to decide.

      `personIds` on evidence. Almost every evidence item lists person ids (`"patch-vector"`), but `E04` lists a person name instead (`"Nova Byte"`). Typing it as `string[]` didn't fix the data, but writing the type down forced the explicit decision to keep `evidenceMentionsPerson()`'s existing double check (`person.id` or `person.name`) instead of quietly assuming every entry is a clean id.

**Questions** (depend on the tasks above)

- [x] Walk through the ambiguous field you picked: how did the JavaScript version get away without deciding on one shape, and what did TypeScript force you to commit to?

      Plain JS never declares what's inside a `string[]`, so `personIds` could silently hold ids in 17 places and a name in one (`E04`) and nothing would complain. Writing `personIds: string[]` in `types.ts` doesn't ban that mix either, but it forced me to actually look at and document the inconsistency, and to keep the lookup code checking both `id` and `name` on purpose rather than by accident.

- [x] Is there a data-shape problem in this app that TypeScript's static types **can't** catch on their own, because the actual bad data would only show up at runtime from a JSON file, not from your code? What would you need in addition to types to catch that?

      Yes, the same `personIds` field, plus the casing mismatches in `evidence.json` (`E03`'s `"Test-Report"` vs everyone else's `"test-report"`, `E12`'s `"Reviewed"`/`"Unknown"` vs lowercase elsewhere). `fetch().json()` returns `any`, so asserting `as Evidence[]` just tells TypeScript to trust the file, it never actually reads it. Catching that needs runtime validation (e.g. a schema check with something like Zod) run on the real JSON, not just a type annotation.

- [x] What's the difference between an `interface` and a `type` alias for an object shape in TypeScript? Which did you use for your domain models, and does it actually matter here?

      Both can describe the same object shape but the main practical differences are that `interface` can be reopened/extended by another `interface` with the same name (declaration merging), while `type` can also name unions and other non-object shapes `interface` can't. Used `interface` for all five domain models, matching `state.ts`'s existing style. Doesn't actually matter here: none of these types need merging or union behaviour, so either would work identically.

---

## Demo 7 — Full migration & resolving type errors across the app

**Tasks**

- [ ] Convert the remaining `.js` modules to `.ts`, and get the **entire app** compiling with zero TypeScript errors under the strictness settings from Demo 5.
- [ ] Find at least 3 real spots where the compiler flagged something you had to actually think about (a union type, a possibly-`undefined` value, an implicit `any`, etc.). For each, decide and record whether it pointed at a real latent bug or was "just" the compiler being pedantic.
- [ ] Confirm the app still behaves identically to the working JavaScript version — a type-safe app that behaves differently is not a successful migration.

**Questions** (depend on the tasks above)

- [ ] Show one specific type error you had to actually think about (not just silence with `any` or the `!` non-null assertion). What did it tell you about your code that plain JS review or testing hadn't?
- [ ] When (if ever) is reaching for `any` the right call during a migration like this, versus a sign you should model the type properly? Where did you draw that line?
- [ ] Did the migration reveal anything that was a genuine, previously-unnoticed bug (as opposed to just noise)? If yes, explain it. If no, explain how you're confident it was only noise.

---

## Demo 8 — GitHub Actions: development workflow

**Tasks**

- [ ] Write a GitHub Actions workflow that triggers on push (and/or pull request), checks out the repo, sets up Node.js at the right version, installs dependencies (with dependency caching), and runs your `lint` and a format-check (e.g. `prettier --check`).
- [ ] Push a commit that deliberately fails lint or format, and show the workflow **failing** in the Actions tab.
- [ ] Fix it and push again, and show the same workflow **passing**.

**Questions** (depend on the tasks above)

- [ ] What is the difference between a workflow, a job, and a step in GitHub Actions? Point to one of each in your workflow file.
- [ ] Why should lint/format run in CI at all, if it already runs (or could run) on every developer's own machine before they push?
- [ ] What is dependency caching doing in your workflow, and what would happen (both correctness- and speed-wise) if you removed it?

---

## Demo 9 — GitHub Actions: deployment workflow

**Tasks**

- [ ] Write a second workflow that, on push to your main branch (or another trigger you choose and can justify), checks out the repo, installs dependencies, lints, builds (`vite build`), and deploys the `dist/` output to GitHub Pages (or an equivalent static host).
- [ ] Confirm the deployed URL actually serves the working app end-to-end, not just that the workflow reports success.
- [ ] Make a real change, push it, and show it going live via the workflow without any manual deployment step.

**Questions** (depend on the tasks above)

- [ ] Why does the deploy workflow re-run lint and build itself, instead of trusting "it already passed on my machine" or reusing Demo 8's workflow's result directly?
- [ ] What is the actual mechanism your deploy workflow uses to publish to GitHub Pages (e.g. a dedicated deploy action publishing an artifact, pushing to a `gh-pages` branch, or something else)? Explain, concretely, what it does.
- [ ] What would you need to change in this workflow if you were deploying to a different static host instead (e.g. Netlify, Vercel, a plain server over SFTP)? What would stay the same?

---

## Demo 10 — Workflow triggers, permissions & failure modes

**Tasks**

- [ ] Deliberately commit a real TypeScript error (or a lint failure) that should block deployment, push it, and show the deploy workflow failing *before* it reaches the deploy step.
- [ ] Identify exactly what permissions and/or secrets your deploy workflow needs to publish to GitHub Pages, and show where they're configured (repository settings, the `permissions:` key in the workflow file, etc.).
- [ ] Open the run history for both workflows and be ready to read a failed run's logs live and explain, to someone unfamiliar with it, what failed and why.

**Questions** (depend on the tasks above)

- [ ] When your build step fails, does the previously-deployed version of the app stay live, get taken down, or something else? Is that the behavior you want, and why?
- [ ] What GitHub Actions permission(s) or secret(s) does your deploy workflow actually need, and where did you grant/store them? What's the security risk of over-granting permissions here?
- [ ] What's the difference between triggering a workflow `on: push`, `on: pull_request`, and `on: workflow_dispatch`? Which did you use for the development workflow (Demo 8) and which for the deployment workflow (Demo 9), and why is that pairing the right one?

---

## What to bring to class

For each of the 10 demos: your changed code/config (ideally as commits you can diff live), the actual GitHub Actions run history for both workflows (not just the files), and the ticked checkboxes
above reflecting what you can genuinely demonstrate and answer *right now*. Be ready to trigger a real workflow run live (e.g. via a small commit) on request, not just describe
one that ran earlier.
