// ---------------------------------------------------------------------
// REACT SHELL - header, nav bar, and real routing
// ---------------------------------------------------------------------
// Exercise 3, Demo 9 first built this with "current view" as plain
// React state, deliberately not tied to the URL at all (see
// EXERCISE_3.md for the trade-off that created: no reload/back-button
// support). Exercise 4, Demo 8 replaces that with react-router.

// HashRouter, not BrowserRouter: tried BrowserRouter first (URLs like
// /AWE/team/locations), and it broke on exactly the thing routes are
// supposed to fix, a hard reload or a typed-in bookmark of that URL
// 404'd in dev and would 404 on GitHub Pages too (a static host with
// no server-side rewrite, found by testing, not hypothetical: the dev
// server's own history fallback served vanilla's index.html instead of
// react.html for an unknown deep path). With HashRouter the part after
// "#" never leaves the browser, so the server only ever sees the one
// real file, /AWE/react.html, on every request, reload included. This
// is the same reasoning the vanilla app's own hash-based router
// (js/router.ts) already relied on, just via a real routing library
// instead of hand-rolled hashchange listeners.


// Exercise 5, Demo 5: bookmark state lives here now, not inside
// EvidencePage. App is the lowest common ancestor of every component
// that reads or changes it (Dashboard's count, Evidence's cards,
// Workspace's list) - react-router unmounts whichever page doesn't
// match the current route, so these three are siblings with no other
// shared owner. Before this, EvidencePage held its own useState and
// Dashboard/Workspace each read localStorage directly on their own
// mount - three independent reads of the same key, not one shared
// fact. Lifting the useState itself up here removes that duplication:
// there is now exactly one array in memory, and the two pages that
// only display it receive it as a plain prop instead of re-reading
// storage. See EXERCISE_5.md Demo 5.
import { useState } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { STORAGE_KEY_BOOKMARKS } from "../storage.js";
import Header from "./shell/Header.js";
import NavBar from "./shell/NavBar.js";
import DashboardPage from "./dashboard/DashboardPage.js";
import EvidencePage from "./evidence/EvidencePage.js";
import PeoplePage from "./people-locations/PeoplePage.js";
import PersonDetailPage from "./people-locations/PersonDetailPage.js";
import TimelinePage from "./timeline/TimelinePage.js";
import WorkspacePage from "./workspace/WorkspacePage.js";
// Exercise 4, Demo 4 live demo (uncomment both this and the line in
// <main> below to show it in class): import KeyDemoThrowaway from "./KeyDemoThrowaway.js";

function readBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BOOKMARKS);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function writeBookmarks(bookmarks: string[]): void {
  localStorage.setItem(STORAGE_KEY_BOOKMARKS, JSON.stringify(bookmarks));
}

export default function App() {
  const [bookmarks, setBookmarks] = useState<string[]>(readBookmarks);

  // Carried over unchanged from EvidencePage (Exercise 5, Demo 3): still
  // a brand new array via .filter()/spread, never a mutation.
  function handleToggleBookmark(evidenceId: string) {
    const next = bookmarks.includes(evidenceId)
      ? bookmarks.filter((id) => id !== evidenceId)
      : [...bookmarks, evidenceId];
    setBookmarks(next);
    writeBookmarks(next);
  }

  // ---------------------------------------------------------------------
  // Exercise 5, Demo 3 live demo (uncomment this function, then swap the
  // `onToggleBookmark={handleToggleBookmark}` prop below to
  // `onToggleBookmark={handleToggleBookmarkBuggy}` to show it in class):
  // click a star and nothing happens, not even a second later, because
  // .push()/.splice() mutate `bookmarks` in place and setBookmarks is
  // then called with that EXACT SAME array reference. React's setState
  // bails out via Object.is(prevState, nextState) and skips the
  // re-render entirely when they're reference-equal, so the star never
  // flips, the data did change in memory (log `bookmarks` in the
  // console right after clicking - it's correct!), React just never
  // found out. Swap back to handleToggleBookmark afterward.
  // function handleToggleBookmarkBuggy(evidenceId: string) {
  //   if (bookmarks.includes(evidenceId)) {
  //     bookmarks.splice(bookmarks.indexOf(evidenceId), 1);
  //   } else {
  //     bookmarks.push(evidenceId);
  //   }
  //   setBookmarks(bookmarks);
  //   writeBookmarks(bookmarks);
  // }

  return (
    <HashRouter>
      <div className="react-shell">
        <Header>
          <NavBar />
        </Header>
        <main>
          {/* <KeyDemoThrowaway /> */}
          <Routes>
            <Route path="/" element={<DashboardPage bookmarks={bookmarks} />} />
            <Route
              path="/evidence"
              element={
                <EvidencePage bookmarks={bookmarks} onToggleBookmark={handleToggleBookmark} />
              }
            />
            {/* "/team" alone has no tab of its own, people is the default. */}
            <Route path="/team" element={<Navigate to="/team/people" replace />} />
            <Route path="/team/people" element={<PeoplePage />} />
            <Route path="/team/locations" element={<PeoplePage />} />
            {/* Demo 9: the first route with a parameter, :personId is
                read inside PersonDetailPage via useParams(). */}
            <Route path="/team/people/:personId" element={<PersonDetailPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/workspace" element={<WorkspacePage bookmarks={bookmarks} />} />
            {/* Mirrors the vanilla handleHashChange() fallback: an
                unrecognized URL lands on the dashboard, not a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
