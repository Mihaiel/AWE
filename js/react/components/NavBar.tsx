// ---------------------------------------------------------------------
// NAV BAR - one button per view, highlights whichever is current
// ---------------------------------------------------------------------
// Exercise 3, Demo 9. Reuses the vanilla nav's "main-nav" wrapper class
// (only used for layout, nothing in JS queries it), but deliberately
// NOT "nav-btn" on the buttons themselves - js/router.ts and js/main.ts
// both run an unscoped `document.querySelectorAll(".nav-btn")` that
// found and mutated these buttons too when they shared that class
// (found by testing: the vanilla hash-change handler stripped "active"
// right back off immediately after React set it). ".react-nav-btn" gets
// the identical look via styles.css without being visible to either
// query. Unlike js/router.ts's two separate DOM-querying loops that
// toggle .active by hand, here "active" is just a prop derived straight
// from currentView, React owns keeping it in sync.
import type { ViewName } from "../types.js";

const VIEWS: { name: ViewName; label: string }[] = [
  { name: "dashboard", label: "Dashboard" },
  { name: "evidence", label: "Evidence" },
  { name: "people", label: "People & Locations" },
  { name: "timeline", label: "Timeline" },
  { name: "workspace", label: "Workspace" },
];

interface NavBarProps {
  currentView: ViewName;
  onNavigate: (view: ViewName) => void;
}

export default function NavBar({ currentView, onNavigate }: NavBarProps) {
  return (
    <nav className="main-nav" aria-label="React shell navigation">
      {VIEWS.map((view) => (
        <button
          key={view.name}
          type="button"
          className={"react-nav-btn" + (view.name === currentView ? " active" : "")}
          onClick={() => onNavigate(view.name)}
        >
          {view.label}
        </button>
      ))}
    </nav>
  );
}
