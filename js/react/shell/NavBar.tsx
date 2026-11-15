// ---------------------------------------------------------------------
// NAV BAR - one real link per view, highlights whichever route is active
// ---------------------------------------------------------------------
// Exercise 3, Demo 9. Reuses the vanilla nav's "main-nav" wrapper class
// (only used for layout, nothing in JS queries it), but deliberately
// NOT "nav-btn" on the links themselves - js/router.ts and js/main.ts
// both run an unscoped `document.querySelectorAll(".nav-btn")` that
// found and mutated these when they shared that class (found by
// testing: the vanilla hash-change handler stripped "active" right
// back off immediately after React set it). ".react-nav-btn" gets the
// identical look via styles.css without being visible to either query.
//
// Exercise 4, Demo 8: these used to be <button onClick> calling back
// into App's own useState. Now they're real <NavLink>s, "active" comes
// from react-router comparing the URL itself, not a prop App hands
// down. `end` on the Dashboard link stops "/" from matching every
// other route too (NavLink's default is a prefix match).
import { NavLink } from "react-router-dom";

const VIEWS: { to: string; label: string; end: boolean }[] = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/evidence", label: "Evidence", end: false },
  { to: "/team", label: "People & Locations", end: false },
  { to: "/timeline", label: "Timeline", end: false },
  { to: "/workspace", label: "Workspace", end: false },
];

export default function NavBar() {
  return (
    <nav className="main-nav" aria-label="React shell navigation">
      {VIEWS.map((view) => (
        <NavLink
          key={view.to}
          to={view.to}
          end={view.end}
          className={({ isActive }) => "react-nav-btn" + (isActive ? " active" : "")}
        >
          {view.label}
        </NavLink>
      ))}
    </nav>
  );
}
