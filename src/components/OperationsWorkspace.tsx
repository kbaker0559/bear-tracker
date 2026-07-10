import OperationsCheckIn from './OperationsCheckIn';
import PairingsImport from './PairingsImport';
import { calculatePayoutSummary } from '../engine/payoutEngine';
import type { Group, Player } from '../types';

type Props = {

  players: Player[];
  groups: Group[];
  expectedCount: number;
  checkedInCount: number;
  paidCount: number;
  onApplyPairings: (groups: Group[]) => void;
  
};

export default function OperationsWorkspace({
  players,
  groups,
  expectedCount,
  checkedInCount,
  paidCount,
  onApplyPairings
}: Props) {
  const payout = calculatePayoutSummary(checkedInCount);

  return (
    <section className="card">
      <h2>Operations Workspace</h2>
      <p>Round setup, pairings, check-in, payments, no-shows, and walk-ons.</p>

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
          <span>{groups.length}</span>
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

      <PairingsImport
  players={players}
  onApplyPairings={onApplyPairings}
/>

      {groups.length > 0 && (
        <>
          <h3>Imported Scorecards</h3>
          <div className="score-grid">
            {groups.map((group) => (
              <div className="score-row" key={group.id}>
                <strong>{group.name.replace('Group', 'Card')}</strong>
                <span>{group.playerIds.length} players</span>
                <ul>
                  {group.playerIds.map((playerId) => {
                    const player = players.find((p) => p.id === playerId);
                    return <li key={playerId}>{player?.name ?? playerId}</li>;
                  })}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}