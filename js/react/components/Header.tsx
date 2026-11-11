// ---------------------------------------------------------------------
// HEADER - branding + whatever nav is passed in, no other state/props
// ---------------------------------------------------------------------
// Exercise 3, Demo 9. Reuses the exact classes from the vanilla header
// (index.html's <header class="app-header">...), not new ones, so it
// renders identically via the same styles.css, no new CSS needed.
// Takes NavBar as `children` rather than rendering it separately: the
// .nav-btn/.react-nav-btn styling (light text, faint white border) only
// reads correctly against .header-inner's dark background, found by
// testing, the nav was unreadable sitting outside it as a page-level
// sibling instead.
import type { ReactNode } from "react";

interface HeaderProps {
  children?: ReactNode;
}

export default function Header({ children }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand">
          <img src="assets/logo/logo.svg" alt="Project ReMotion logo" className="brand-logo" />
          <div>
            <h1>Project ReMotion (React shell)</h1>
            <p className="subtitle">
              Investigate the failure of an AI-assisted rehabilitation robot.
            </p>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
}
