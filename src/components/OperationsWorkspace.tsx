import {
  useEffect,
  useRef,
  useState
} from 'react';
import type { Group, Player } from '../types';
import type { RoundPlayer, RoundPlayerStatus } from '../types/roundPlayer';
import { calculatePayoutSummary } from '../engine/payoutEngine';
import CardArrivalStatus from './CardArrivalStatus';
import OperationsCheckIn from './OperationsCheckIn';
import PairingsImport from './PairingsImport';
import RegistrationReadyPanel from './RegistrationReadyPanel';
import PlayerStatusManager from './PlayerStatusManager';
import SaturdayMorningDashboard from './SaturdayMorningDashboard';
import SaturdayPairingManager from './SaturdayPairingManager';
import TournamentEventLog from './TournamentEventLog';
import type { NavigationSection } from '../types/navigation';
import WeeklyPlayerReview, {
  type WeeklyPlayerSnapshot
} from './WeeklyPlayerReview';

type ArrivalPayment = {
  cashPaid: number;
  creditApplied: number;
  paidByPlayerId?: string;
  note?: string;
};

type Props = {
  players: Player[];
  groups: Group[];
  weeklyPlayers: WeeklyPlayerSnapshot[];
  roundPlayers: RoundPlayer[];
  tournamentEvents: import('../types/tournamentEvent').TournamentEvent[];

  expectedCount: number;
  checkedInCount: number;
  paidCount: number;

  expectedPlayerIds: string[];
  checkedInPlayerIds: string[];
  paidPlayerIds: string[];

  onApplyPairings: (groups: Group[]) => void;
  onSetInactiveStatus: (
    playerId: string,
    status: Extract<RoundPlayerStatus, 'dns' | 'withdrawn' | 'removed'>,
    reason: string
  ) => void;
  onRestorePlayer: (playerId: string) => void;
  onAddPlayerBack: (
    playerId: string,
    groupId: string,
    handicap: number,
    quota: number,
    additionType: 'late-add' | 'restore-missing',
    note: string
  ) => void;
  onUpdateWeeklyPlayer: (
    playerId: string,
    handicap: number,
    quota: number
  ) => void;

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

  onReorderScorecard: (
    groupId: string,
    orderedPlayerIds: string[]
  ) => void;

  onStartRound: () => void;

  getAvailableCredit: (playerId: string) => number;

  onCompleteArrival: (
    playerId: string,
    payment: ArrivalPayment
  ) => void;

  onAddTournamentNote: (note: string) => void;
  navigationSection?: NavigationSection;
  onNavigationHandled: () => void;
};

export default function OperationsWorkspace({
  players,
  groups,
  weeklyPlayers,
  roundPlayers,
  tournamentEvents,
  expectedCount,
  checkedInCount,
  paidCount,
  expectedPlayerIds,
  checkedInPlayerIds,
  paidPlayerIds,
  onApplyPairings,
  onSetInactiveStatus,
  onRestorePlayer,
  onAddPlayerBack,
  onUpdateWeeklyPlayer,
  onMovePlayer,
  onSwapPlayers,
  onChangeScorekeeper,
  onReorderScorecard,
  onStartRound,
  getAvailableCredit,
  onCompleteArrival,
  onAddTournamentNote,
  navigationSection,
  onNavigationHandled
}: Props) {
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRemovePlayer, setShowRemovePlayer] = useState(false);
  const [showPairingManager, setShowPairingManager] =
    useState(false);

  const pairingsRef = useRef<HTMLDivElement | null>(null);
  const weeklyReviewRef = useRef<HTMLDivElement | null>(null);
  const checkInRef = useRef<HTMLDivElement | null>(null);
  const removePlayerRef = useRef<HTMLDivElement | null>(null);
  const pairingManagerRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (!navigationSection) return;

    let target: HTMLElement | null = null;
    let focusSelector: string | null = null;

    if (navigationSection === 'pairings-import') {
      target = pairingsRef.current;
      focusSelector = 'textarea';
    } else if (navigationSection === 'weekly-review') {
      target = weeklyReviewRef.current;
      focusSelector = 'input[type="number"]';
    } else if (navigationSection === 'card-order') {
      setShowPairingManager(true);
      target = pairingManagerRef.current;
    } else if (navigationSection === 'arrivals') {
      setShowCheckIn(true);
      target = checkInRef.current;
    }

    window.setTimeout(() => {
      const resolvedTarget =
        navigationSection === 'card-order'
          ? pairingManagerRef.current
          : navigationSection === 'arrivals'
            ? checkInRef.current
            : target;

      resolvedTarget?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });

      resolvedTarget?.classList.add('navigation-highlight');
      window.setTimeout(() => {
        resolvedTarget?.classList.remove('navigation-highlight');
      }, 1400);

      if (focusSelector) {
        (resolvedTarget?.querySelector(focusSelector) as HTMLElement | null)?.focus({
          preventScroll: true
        });
      }

      onNavigationHandled();
    }, 100);
  }, [navigationSection, onNavigationHandled]);

  const payout = calculatePayoutSummary(paidCount);

  useEffect(() => {
    const target = showCheckIn
      ? checkInRef.current
      : showRemovePlayer
        ? removePlayerRef.current
        : showPairingManager
          ? pairingManagerRef.current
          : null;

    if (!target) return;

    window.setTimeout(() => {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 0);
  }, [
    showCheckIn,
    showRemovePlayer,
    showPairingManager
  ]);

  function closeAllPanels() {
    setShowCheckIn(false);
    setShowRemovePlayer(false);
    setShowPairingManager(false);
  }

  function openCheckIn() {
    closeAllPanels();
    setShowCheckIn(true);
  }

  function openRemovePlayer() {
    closeAllPanels();
    setShowRemovePlayer(true);
  }

  function openPairingManager() {
    closeAllPanels();
    setShowPairingManager(true);
  }


  function handleApplyPairings(importedGroups: Group[]) {
    onApplyPairings(importedGroups);

    window.setTimeout(() => {
      const reorganize = window.confirm(
        'Pairings applied. Do you want to reorganize the player order on the scorecards now?'
      );

      if (reorganize) {
        setShowPairingManager(true);
        window.setTimeout(() => {
          pairingManagerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }, 100);
        return;
      }

      weeklyReviewRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 150);
  }



  return (
    <section className="card">
      <h2>Weekly Round Operations</h2>

      <p>
        Complete Friday preparation first, then use the
        Saturday Morning section for arrivals and final
        changes.
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

      <section className="card">
        <p className="eyebrow">Friday Preparation</p>
        <h2>Pairings and Weekly Player Values</h2>

        <p>
          Import the weekly pairings, then work down the
          handicap and Points Needed list before Saturday.
        </p>

        <div ref={pairingsRef} id="pairings-import">
          <PairingsImport
            players={players}
            onApplyPairings={handleApplyPairings}
          />
        </div>

        <div ref={weeklyReviewRef} id="weekly-review">
        <WeeklyPlayerReview
          players={players}
          weeklyPlayers={weeklyPlayers}
          onUpdateWeeklyPlayer={onUpdateWeeklyPlayer}
        />
        </div>
      </section>

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
            <div ref={pairingManagerRef} id="card-order">
              <SaturdayPairingManager
                groups={groups}
                players={players}
                onMovePlayer={onMovePlayer}
                onSwapPlayers={onSwapPlayers}
                onChangeScorekeeper={onChangeScorekeeper}
                onReorderScorecard={onReorderScorecard}
              />
            </div>
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
            <div ref={checkInRef} id="arrivals">
              <OperationsCheckIn
                players={players}
                expectedPlayerIds={expectedPlayerIds}
                checkedInPlayerIds={checkedInPlayerIds}
                paidPlayerIds={paidPlayerIds}
                getAvailableCredit={getAvailableCredit}
                onCompleteArrival={onCompleteArrival}
              />
            </div>
          )}

          {showRemovePlayer && (
            <div ref={removePlayerRef}>
              <PlayerStatusManager
                players={players}
                groups={groups}
                roundPlayers={roundPlayers}
                onSetInactiveStatus={onSetInactiveStatus}
                onRestorePlayer={onRestorePlayer}
                onAddPlayerBack={onAddPlayerBack}
                onClose={() => setShowRemovePlayer(false)}
              />
            </div>
          )}

          <TournamentEventLog
            events={tournamentEvents}
            players={players}
            groups={groups}
            onAddNote={onAddTournamentNote}
          />

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
