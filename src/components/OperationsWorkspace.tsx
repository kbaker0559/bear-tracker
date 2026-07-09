import { calculatePayoutSummary } from '../engine/payoutEngine';

type Props = {
  expectedCount: number;
  checkedInCount: number;
  paidCount: number;
};

export default function OperationsWorkspace({
  expectedCount,
  checkedInCount,
  paidCount
}: Props) {
  const payout = calculatePayoutSummary(checkedInCount);

  return (
    <section className="card">
      <h2>Operations Workspace</h2>
      <p>Check-in, payments, no-shows, walk-ons, and round readiness.</p>

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
          <strong>Entry Fees Collected</strong>
          <span>${payout.entryFees}</span>
        </div>

        <div className="score-row">
          <strong>Hole-in-One Contribution</strong>
          <span>${payout.holeInOneContribution}</span>
        </div>

        <div className="score-row">
          <strong>Today&apos;s Prize Pool</strong>
          <span>${payout.prizePool}</span>
        </div>
      </div>
    </section>
  );
}