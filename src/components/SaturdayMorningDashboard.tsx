type Props = {
  expectedCount: number;
  checkedInCount: number;
  paidCount: number;
  scorecardCount: number;
  onOpenCheckIn: () => void;
};

export default function SaturdayMorningDashboard({
  expectedCount,
  checkedInCount,
  paidCount,
  scorecardCount,
  onOpenCheckIn
}: Props) {
  return (
    <section className="card">
      <h2>Saturday Morning</h2>

      <div className="score-grid">
        <div className="score-row">
          <strong>👥 Expected</strong>
          <span>{expectedCount}</span>
        </div>

        <div className="score-row">
          <strong>✅ Checked In</strong>
          <span>{checkedInCount}</span>
        </div>

        <div className="score-row">
          <strong>💵 Paid</strong>
          <span>{paidCount}</span>
        </div>

        <div className="score-row">
          <strong>📝 Scorecards</strong>
          <span>{scorecardCount}</span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '1.5rem',
          flexWrap: 'wrap'
        }}
      >
        <button onClick={onOpenCheckIn}>
          Open Check-In
        </button>

        <button disabled>
          Payments
        </button>

        <button disabled>
          Walk-Ons
        </button>

        <button disabled>
          Round Scorecards
        </button>
      </div>
    </section>
  );
}