type Props = {
  expectedCount: number;
  checkedInCount: number;
  paidCount: number;
  scorecardCount: number;
};

export default function HomeWorkspace({
  expectedCount,
  checkedInCount,
  paidCount,
  scorecardCount
}: Props) {
  return (
    <section className="card">
      <h2>Home Workspace</h2>
      <p>Mission control for the current round.</p>

      <div className="score-grid">
        <div className="score-row">
          <strong>Players Expected</strong>
          <span>{expectedCount}</span>
        </div>

        <div className="score-row">
          <strong>Checked In</strong>
          <span>{checkedInCount}</span>
        </div>

        <div className="score-row">
          <strong>Paid</strong>
          <span>{paidCount}</span>
        </div>

        <div className="score-row">
          <strong>Scorecards</strong>
          <span>{scorecardCount}</span>
        </div>
      </div>
    </section>
  );
}