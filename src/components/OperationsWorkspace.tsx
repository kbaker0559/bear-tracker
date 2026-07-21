import { useState } from 'react';
import type { Group, Player } from '../types';
import { calculatePayoutSummary } from '../engine/payoutEngine';
import CardArrivalStatus from './CardArrivalStatus';
import OperationsCheckIn from './OperationsCheckIn';
import PairingsImport from './PairingsImport';
import RegistrationReadyPanel from './RegistrationReadyPanel';
import RemoveRoundPlayer from './RemoveRoundPlayer';
import SaturdayMorningDashboard from './SaturdayMorningDashboard';
import SaturdayPairingManager from './SaturdayPairingManager';

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

  onMovePlayer: (
    playerId: string,
    fromGroupId: string,
    toGroupId: string
  ) => void;

  onSwapPlayers: (
    firstPlayerId: string,
    secondPlayerId: string
  ) => void;

  onChangeScorekeeper: (
    groupId: string,
    playerId: string
  ) => void;

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
  onMovePlayer,
  onSwapPlayers,
  onChangeScorekeeper,
  onStartRound,
  getAvailableCredit,
  onCompleteArrival
}: Props) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRemovePlayer, setShowRemovePlayer] = useState(false);
  const [showPairingManager, setShowPairingManager] =
    useState(false);

  const payout = calculatePayoutSummary(paidCount);

  function openCheckIn() {
    setShowCheckIn(true);
    setShowRemovePlayer(false);
    setShowPairingManager(false);
  }

  function openRemovePlayer() {
    setShowRemovePlayer(true);
    setShowCheckIn(false);
    setShowPairingManager(false);
  }

  function openPairingManager() {
    setShowPairingManager(true);
    setShowCheckIn(false);
    setShowRemovePlayer(false);
  }

  return (
    <section className="card">
      <h2>Operations Workspace</h2>

      <p>
        Round setup, pairings, arrivals, entry payments,
        withdrawals, walk-ons, and final card adjustments.
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
            onOpenCheckIn={openCheckIn}
            onOpenRemovePlayer={openRemovePlayer}
          />

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              marginBottom: '1rem'
            }}
          >
            <button
              type="button"
              onClick={openPairingManager}
            >
              Manage Pairings
            </button>
          </div>

          {showPairingManager && (
            <SaturdayPairingManager
              groups={groups}
              players={players}
              onMovePlayer={onMovePlayer}
              onSwapPlayers={onSwapPlayers}
              onChangeScorekeeper={onChangeScorekeeper}
            />
          )}

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

                    const isScorekeeper =
                      group.scorekeeperIds.includes(playerId);

                    return (
                      <li key={playerId}>
                        {player?.name ?? playerId}
                        {isScorekeeper ? ' — Scorekeeper' : ''}
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