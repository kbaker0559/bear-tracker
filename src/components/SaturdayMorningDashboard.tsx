type Props = {
  expectedCount: number;
  checkedInCount: number;
  paidCount: number;
  scorecardCount: number;
  onOpenCheckIn: () => void;
  onOpenRemovePlayer: () => void;
};

export default function SaturdayMorningDashboard({
  expectedCount,
  checkedInCount,
  paidCount,
  scorecardCount,
  onOpenCheckIn,
  onOpenRemovePlayer
}: Props) {
  const progress =
    expectedCount > 0
      ? Math.round((checkedInCount / expectedCount) * 100)
      : 0;

  const remainingCount = Math.max(
    expectedCount - checkedInCount,
    0
  );

  return (
    <section className="card">
      <h2>Saturday Morning</h2>

      <div style={{ marginBottom: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '1rem',
            marginBottom: '0.5rem'
          }}
        >
          <strong>Arrival Progress</strong>

          <span>
            {checkedInCount} of {expectedCount}
          </span>
        </div>

        <div
          style={{
            width: '100%',
            height: '1.25rem',
            background: '#e5e7eb',
            borderRadius: '999px',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              background: '#2f855a',
              transition: 'width 200ms ease'
            }}
          />
        </div>

        <p style={{ marginBottom: 0 }}>
          {progress}% arrived · {remainingCount} remaining
        </p>
      </div>

      <div className="score-grid">
        <div className="score-row">
          <strong>👥 Expected</strong>
          <span>{expectedCount}</span>
        </div>

        <div className="score-row">
          <strong>✅ Arrived</strong>
          <span>{checkedInCount}</span>
        </div>

        <div className="score-row">
          <strong>💵 Entries Satisfied</strong>
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
        <button type="button" onClick={onOpenCheckIn}>
          Arrive Player
        </button>

        <button type="button" disabled>
          Add Walk-On
        </button>

        <button type="button" onClick={onOpenRemovePlayer}>
          Player Status
        </button>

        <button type="button" disabled>
          Round Scorecards
        </button>
      </div>
    </section>
  );
}
