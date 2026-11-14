// ---------------------------------------------------------------------
// PANEL - a generic titled container, takes children instead of a data
// prop (composition, Exercise 4 Demo 1's second required component)
// ---------------------------------------------------------------------
// Reuses the existing .dashboard-panel class (already styled, used by
// Exercise 3's ReviewProgressBar/recent-lists), not a new one - the
// shape (title + arbitrary content) is generic enough that it didn't
// need its own CSS, just its own component for the structure.
import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  children: ReactNode;
}

export default function Panel({ title, children }: PanelProps) {
  return (
    <div className="dashboard-panel">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
