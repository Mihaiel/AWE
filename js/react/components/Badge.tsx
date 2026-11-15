// ---------------------------------------------------------------------
// BADGE - generic colored pill, Exercise 4 Demo 7
// ---------------------------------------------------------------------
// Takes the already-resolved "badge-xxx" modifier class and renders the
// label inside it via children. Doesn't know about certainty, evidence
// status, or relevance, those lookups stay in the three call sites
// below (CertaintyBadge, CaseSummaryCard, DashboardPage), each already
// has its own domain-specific class, this just stops each of them from
// re-writing the same <span className={"badge " + x}>{...}</span> shell.
import type { ReactNode } from "react";

interface BadgeProps {
  variantClass: string;
  children: ReactNode;
}

export default function Badge({ variantClass, children }: BadgeProps) {
  return <span className={"badge " + variantClass}>{children}</span>;
}
