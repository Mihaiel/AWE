// ---------------------------------------------------------------------
// REACT SHELL - header, nav bar, and a minimal routing skeleton
// ---------------------------------------------------------------------
// Exercise 3, Demo 9. "Current view" lives in plain React state here,
// deliberately NOT tied to window.location.hash. This shell mounts
// alongside the vanilla app on the exact same page (Demo 6's coexistence
// flag), and the vanilla router already owns the URL hash; having two
// independent apps both read/write the same hash on one page would
// mean every click in one navigates the other too. See EXERCISE_3.md
// for the full trade-off this creates (no reload/back-button support
// here, unlike the vanilla version).
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
    <div className="react-shell-placeholder">
      <Header>
        <NavBar currentView={currentView} onNavigate={setCurrentView} />
      </Header>
      <main>
        <CurrentPage />
      </main>
    </div>
  );
}
