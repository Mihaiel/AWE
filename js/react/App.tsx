// ---------------------------------------------------------------------
// REACT SHELL - header, nav bar, and real routing
// ---------------------------------------------------------------------
// Exercise 3, Demo 9 first built this with "current view" as plain
// React state, deliberately not tied to the URL at all (see
// EXERCISE_3.md for the trade-off that created: no reload/back-button
// support). Exercise 4, Demo 8 replaces that with react-router.
//
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
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import Header from "./shell/Header.js";
import NavBar from "./shell/NavBar.js";
import DashboardPage from "./dashboard/DashboardPage.js";
import EvidencePage from "./evidence/EvidencePage.js";
import PeoplePage from "./people-locations/PeoplePage.js";
import TimelinePage from "./timeline/TimelinePage.js";
import WorkspacePage from "./workspace/WorkspacePage.js";
// Exercise 4, Demo 4 live demo (uncomment both this and the line in
// <main> below to show it in class): import KeyDemoThrowaway from "./KeyDemoThrowaway.js";

export default function App() {
  return (
    <HashRouter>
      <div className="react-shell">
        <Header>
          <NavBar />
        </Header>
        <main>
          {/* <KeyDemoThrowaway /> */}
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/evidence" element={<EvidencePage />} />
            {/* "/team" alone has no tab of its own, people is the default. */}
            <Route path="/team" element={<Navigate to="/team/people" replace />} />
            <Route path="/team/people" element={<PeoplePage />} />
            <Route path="/team/locations" element={<PeoplePage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/workspace" element={<WorkspacePage />} />
            {/* Mirrors the vanilla handleHashChange() fallback: an
                unrecognized URL lands on the dashboard, not a blank page. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
}
