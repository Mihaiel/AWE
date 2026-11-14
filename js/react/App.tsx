// ---------------------------------------------------------------------
// REACT SHELL - header, nav bar, and a minimal routing skeleton
// ---------------------------------------------------------------------
// Exercise 3, Demo 9. "Current view" lives in plain React state here,
// deliberately NOT tied to window.location.hash. Exercise 4 moved this
// shell onto its own page (react.html) instead of coexisting with the
// vanilla app, but it still doesn't touch the URL: no real router yet,
// that's Demo 8's job. See EXERCISE_3.md for the trade-off this created
// (no reload/back-button support here, unlike the vanilla version).
import { useState } from "react";
import type { ViewName } from "./types.js";
import Header from "./components/Header.js";
import NavBar from "./components/NavBar.js";
import DashboardPage from "./pages/DashboardPage.js";
import EvidencePage from "./pages/EvidencePage.js";
import PeoplePage from "./pages/PeoplePage.js";
import TimelinePage from "./pages/TimelinePage.js";
import WorkspacePage from "./pages/WorkspacePage.js";

// A Record keyed by ViewName (not a plain function with a default case)
// means TypeScript itself refuses to compile if a view is ever removed
// from the ViewName union without updating this map, or vice versa.
const PAGES: Record<ViewName, () => React.JSX.Element> = {
  dashboard: DashboardPage,
  evidence: EvidencePage,
  people: PeoplePage,
  timeline: TimelinePage,
  workspace: WorkspacePage,
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewName>("dashboard");
  const CurrentPage = PAGES[currentView];

  return (
    <div className="react-shell">
      <Header>
        <NavBar currentView={currentView} onNavigate={setCurrentView} />
      </Header>
      <main>
        <CurrentPage />
      </main>
    </div>
  );
}
