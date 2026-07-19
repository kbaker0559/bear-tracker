import { useState } from 'react';
import type { Group, Player } from '../types';
import { calculatePayoutSummary } from '../engine/payoutEngine';
import CardArrivalStatus from './CardArrivalStatus';
import OperationsCheckIn from './OperationsCheckIn';
import PairingsImport from './PairingsImport';
import RegistrationReadyPanel from './RegistrationReadyPanel';
import RemoveRoundPlayer from './RemoveRoundPlayer';
import SaturdayMorningDashboard from './SaturdayMorningDashboard';

type ArrivalPayment = {
  cashPaid: number;
  creditApplied: number;
};

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
  onRemovePlayer: (playerId: string) => void;
  onStartRound: () => void;

  getAvailableCredit: (playerId: string) => number;

  onCompleteArrival: (
    playerId: string,
    payment: ArrivalPayment
  ) => void;
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
  onRemovePlayer,
  onStartRound,
  getAvailableCredit,
  onCompleteArrival
}: Props) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRemovePlayer, setShowRemovePlayer] = useState(false);

  const payout = calculatePayoutSummary(paidCount);

  return (
    <section className="card">
      <h2>Operations Workspace</h2>

      <p>
        Round setup, pairings, arrivals, entry payments,
        withdrawals, and walk-ons.
      </p>

      <div className="score-grid">
        <div className="score-row">
          <strong>Players Expected</strong>
          <span>{expectedCount}</span>
        </div>

        <div className="score-row">
          <strong>Arrived</strong>
          <span>{checkedInCount}</span>
        </div>

        <div className="score-row">
          <strong>Entries Satisfied</strong>
          <span>{paidCount}</span>
        </div>

        <div className="score-row">
          <strong>Scorecards</strong>
          <span>{groups.length}</span>
        </div>

        <div className="score-row">
          <strong>Entry Value Satisfied</strong>
          <span>${payout.entryFees}</span>
        </div>

        <div className="score-row">
          <strong>Hole-in-One Allocation</strong>
          <span>${payout.holeInOneContribution}</span>
        </div>

        <div className="score-row">
          <strong>Prize-Pool Allocation</strong>
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
            onOpenCheckIn={() => {
              setShowCheckIn(true);
              setShowRemovePlayer(false);
            }}
            onOpenRemovePlayer={() => {
              setShowRemovePlayer(true);
              setShowCheckIn(false);
            }}
          />

          <CardArrivalStatus
            groups={groups}
            players={players}
            checkedInPlayerIds={checkedInPlayerIds}
          />

          <RegistrationReadyPanel
            expectedCount={expectedCount}
            checkedInCount={checkedInCount}
            paidCount={paidCount}
            onStartRound={onStartRound}
          />

          {showCheckIn && (
            <OperationsCheckIn
              players={players}
              expectedPlayerIds={expectedPlayerIds}
              checkedInPlayerIds={checkedInPlayerIds}
              paidPlayerIds={paidPlayerIds}
              getAvailableCredit={getAvailableCredit}
              onCompleteArrival={onCompleteArrival}
            />
          )}

          {showRemovePlayer && (
            <RemoveRoundPlayer
              players={players}
              expectedPlayerIds={expectedPlayerIds}
              onRemovePlayer={onRemovePlayer}
              onClose={() => setShowRemovePlayer(false)}
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