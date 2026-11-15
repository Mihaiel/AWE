// ---------------------------------------------------------------------
// CASE SUMMARY CARD - from Demo 7's component hierarchy
// ---------------------------------------------------------------------
// Exercise 3, Demo 10. Same markup/classes as the vanilla dashboard's
// case-summary-card (js/views/dashboard.ts), no new CSS needed.
//
// Exercise 4, Demo 7: the badge pill itself now comes from the shared
// Badge component instead of a hand-written span.
import Badge from "../components/Badge.js";

interface CaseSummaryCardProps {
  title: string;
  status: string;
  summary: string;
}

export default function CaseSummaryCard({ title, status, summary }: CaseSummaryCardProps) {
  return (
    <div className="case-summary-card">
      <h3>{title}</h3>
      <p>
        <Badge variantClass="badge-flagged">{status.toUpperCase()}</Badge>
      </p>
      <p>{summary}</p>
    </div>
  );
}
