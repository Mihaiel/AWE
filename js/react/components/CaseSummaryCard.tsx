// ---------------------------------------------------------------------
// CASE SUMMARY CARD - from Demo 7's component hierarchy
// ---------------------------------------------------------------------
// Exercise 3, Demo 10. Same markup/classes as the vanilla dashboard's
// case-summary-card (js/views/dashboard.ts), no new CSS needed.
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
        <span className="badge badge-flagged">{status.toUpperCase()}</span>
      </p>
      <p>{summary}</p>
    </div>
  );
}
