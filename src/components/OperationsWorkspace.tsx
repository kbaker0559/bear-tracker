import { useState } from 'react';
import type { Group, Player } from '../types';
import { calculatePayoutSummary } from '../engine/payoutEngine';
import OperationsCheckIn from './OperationsCheckIn';
import PairingsImport from './PairingsImport';
import SaturdayMorningDashboard from './SaturdayMorningDashboard';

type Props = {
  players: Player[];
  groups: Group[];

  expectedCount: number;
  checkedInCount: number;
  paidCount: number;

  expectedPlayerIds: string[];
  checkedInPlayerIds: string[];
  paidPlayerIds: string[];

  onApplyPairings: (groups: Group[]) => void;
  onToggleCheckedIn: (playerId: string) => void;
  onTogglePaid: (playerId: string) => void;
};

export default function OperationsWorkspace({
  players,
  groups,
  expectedCount,
  checkedInCount,
  paidCount,
  expectedPlayerIds,
  checkedInPlayerIds,
  paidPlayerIds,
  onApplyPairings,
  onToggleCheckedIn,
  onTogglePaid
}: Props) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const payout = calculatePayoutSummary(paidCount);

  return (
    <section className="card">
      <h2>Operations Workspace</h2>

      <p>
        Round setup, pairings, check-in, payments, no-shows, and walk-ons.
      </p>

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
          <strong>Today&apos;s Prize Pool Collected</strong>
          <span>${payout.prizePool}</span>
        </div>
      </div>

      <PairingsImport
        players={players}
        onApplyPairings={onApplyPairings}
      />

      {groups.length > 0 && (
        <>
        <SaturdayMorningDashboard
  expectedCount={expectedCount}
  checkedInCount={checkedInCount}
  paidCount={paidCount}
  scorecardCount={groups.length}
  onOpenCheckIn={() => setShowCheckIn(true)}
/>

{showCheckIn && (
  <OperationsCheckIn
    players={players}
    expectedPlayerIds={expectedPlayerIds}
    checkedInPlayerIds={checkedInPlayerIds}
    paidPlayerIds={paidPlayerIds}
    onToggleCheckedIn={onToggleCheckedIn}
    onTogglePaid={onTogglePaid}
  />
)}  

          <h3>Round Scorecards</h3>

          <div className="score-grid">
            {groups.map((group) => (
              <div className="score-row" key={group.id}>
                <strong>
                  {group.name.replace('Group', 'Card')}
                </strong>

                <span>{group.playerIds.length} players</span>

                <ul>
                  {group.playerIds.map((playerId) => {
                    const player = players.find(
                      (candidate) => candidate.id === playerId
                    );

                    return (
                      <li key={playerId}>
                        {player?.name ?? playerId}
                      </li>
                    );
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