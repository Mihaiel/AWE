// ---------------------------------------------------------------------
// MINI LIST ITEM - reused across Dashboard's two recent-items lists
// ---------------------------------------------------------------------
// Exercise 3, Demo 10. The exact duplication Demo 7 picked out: the
// vanilla version hand-builds this "mini-list-item" markup separately
// in js/views/dashboard.ts (twice) and js/views/workspace.ts (twice).
import type { ReactNode } from "react";

interface MiniListItemProps {
  primaryText: string;
  secondaryText: string;
  badge?: ReactNode;
}

export default function MiniListItem({ primaryText, secondaryText, badge }: MiniListItemProps) {
  return (
    <div className="mini-list-item">
      <strong>{primaryText}</strong> &mdash; {secondaryText} {badge}
    </div>
  );
}
