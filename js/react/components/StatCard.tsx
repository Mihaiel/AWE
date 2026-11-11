// ---------------------------------------------------------------------
// STAT CARD - reused 5 times on the Dashboard (Demo 7's hierarchy)
// ---------------------------------------------------------------------
interface StatCardProps {
  value: number;
  label: string;
}

export default function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
