import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import HomeWorkspace from './components/HomeWorkspace';
import OperationsWorkspace from './components/OperationsWorkspace';
import TournamentWorkspace from './components/TournamentWorkspace';
import { bearTrackerScoringSettings } from './config/bearTrackerScoring';
import { initialPlayers } from './data/players';
import { blackBearCourse } from './data/blackBearCourse';
import {
  createEmptyRound,
  createRoundFromScorecards,
  type RoundBundle
} from './engine/roundEngine';
import {
  addLedgerEntry,
  availablePlayerCredit,
  createPlayerAccount
} from './engine/playerAccountEngine';
import {
  getRoundGuidance,
  recommendRoundState
} from './engine/roundDirector';
import {
  changeCardScorekeeper,
  movePlayerBetweenCards,
  swapPlayersBetweenCards
} from './engine/roundManager';
import {
  markScorecardEntryVerified,
  updateGrossScore,
  updatePaperPlayerTotals
} from './engine/scoreEntryEngine';
import {
  clearSavedCurrentRound,
  loadCurrentRound,
  saveCurrentRound
} from './storage/currentRoundStorage';
import type { Group, Player } from './types';
import type { PlayerAccount } from './types/playerAccount';
import type { Scorecard } from './types/scorecard';
import type { PaperPlayerTotals } from './types/paperScorecardTotals';
import {
  bearTrackerTournamentVisibility
} from './types/tournamentVisibility';
import './styles.css';

type Workspace =
  | 'home'
  | 'operations'
  | 'tournament'
  | 'finance'
  | 'league'
  | 'admin';

type ArrivalPayment = {
  cashPaid: number;
  creditApplied: number;
};

const ENTRY_FEE = 25;

export default function App() {
  const [currentWorkspace, setCurrentWorkspace] =
    useState<Workspace>('home');

  const [players] =
    useState<Player[]>(initialPlayers);

  const [savedCurrentRound] = useState(() =>
    loadCurrentRound()
  );

  const [roundBundle, setRoundBundle] =
    useState<RoundBundle>(() =>
      savedCurrentRound?.roundBundle ??
      createEmptyRound(
        new Date().toISOString().slice(0, 10)
      )
    );

  const [playerAccounts, setPlayerAccounts] =
    useState<PlayerAccount[]>(() =>
      savedCurrentRound?.playerAccounts ??
      initialPlayers.map((player) =>
        createPlayerAccount(player.id)
      )
    );

  const [groups, setGroups] = useState<Group[]>(
    () => savedCurrentRound?.groups ?? []
  );

  useEffect(() => {
    saveCurrentRound({
      roundBundle,
      groups,
      playerAccounts
    });
  }, [
    roundBundle,
    groups,
    playerAccounts
  ]);

  useEffect(() => {
    const recommendedState =
      recommendRoundState(roundBundle);

    if (
      recommendedState ===
      roundBundle.round.state
    ) {
      return;
    }

    setRoundBundle((current) => ({
      ...current,
      round: {
        ...current.round,
        state: recommendedState
      }
    }));
  }, [roundBundle]);

  const roundGuidance =
    getRoundGuidance(roundBundle);

  const expectedCount =
    roundBundle.round.expectedPlayerCount;

  const checkedInCount =
    roundBundle.round.checkedInCount;

  const paidCount =
    roundBundle.round.paidCount;

  const scorecardCount =
    roundBundle.round.scorecardCount;

  const expectedPlayerIds =
    roundBundle.roundPlayers.map(
      (player) => player.playerId
    );

  const checkedInPlayerIds =
    roundBundle.roundPlayers
      .filter((player) => player.checkedIn)
      .map((player) => player.playerId);

  const paidPlayerIds =
    roundBundle.roundPlayers
      .filter((player) => player.paid)
      .map((player) => player.playerId);

  function applyPairings(
    importedGroups: Group[]
  ) {
    const scorecards: Scorecard[] =
      importedGroups.map(
        (group, index) => ({
          id: group.id,
          roundId: roundBundle.round.id,
          cardNumber: index + 1,
          teeTime: '',
          players: group.playerIds.map(
            (playerId) => {
              const player = players.find(
                (candidate) =>
                  candidate.id === playerId
              );

              return {
                playerId,
                tee: '',
                handicapAtPairing:
                  player?.handicap ?? 0
              };
            }
          ),
          scorekeeperId:
            group.scorekeeperIds[0],
          status: 'scheduled',
          notes: undefined
        })
      );

    const createdRound =
      createRoundFromScorecards(
        roundBundle.round.date,
        scorecards,
        players
      );

    setGroups(importedGroups);
    setRoundBundle(createdRound);
  }

  function getAvailableCredit(
    playerId: string
  ): number {
    const account =
      playerAccounts.find(
        (candidate) =>
          candidate.playerId === playerId
      );

    return account
      ? availablePlayerCredit(account)
      : 0;
  }

  function completeArrival(
    playerId: string,
    payment: ArrivalPayment
  ) {
    const totalApplied =
      payment.cashPaid +
      payment.creditApplied;

    if (totalApplied !== ENTRY_FEE) {
      window.alert(
        `The payment must total $${ENTRY_FEE}.`
      );
      return;
    }

    const availableCredit =
      getAvailableCredit(playerId);

    if (
      payment.creditApplied >
      availableCredit
    ) {
      window.alert(
        'The credit applied exceeds the player’s available balance.'
      );
      return;
    }

    setRoundBundle((current) => {
      const roundPlayers =
        current.roundPlayers.map(
          (player) =>
            player.playerId === playerId
              ? {
                  ...player,
                  status:
                    'checked-in' as const,
                  checkedIn: true,
                  paid: true,
                  amountPaid: ENTRY_FEE,
                  cashPaid:
                    payment.cashPaid,
                  creditApplied:
                    payment.creditApplied,
                  paidByPlayerId:
                    undefined
                }
              : player
        );

      return {
        ...current,
        roundPlayers,
        round: {
          ...current.round,
          state:
            'registration-open',
          checkedInCount:
            roundPlayers.filter(
              (player) =>
                player.checkedIn
            ).length,
          paidCount:
            roundPlayers.filter(
              (player) => player.paid
            ).length
        }
      };
    });

    if (payment.creditApplied > 0) {
      setPlayerAccounts(
        (currentAccounts) =>
          currentAccounts.map(
            (account) =>
              account.playerId ===
              playerId
                ? addLedgerEntry(
                    account,
                    {
                      playerId,
                      date:
                        roundBundle.round
                          .date,
                      type:
                        'credit-applied',
                      description:
                        'League credit applied to round entry fee',
                      amount:
                        -payment.creditApplied,
                      roundId:
                        roundBundle.round.id
                    }
                  )
                : account
          )
      );
    }
  }

  function removePlayerFromRound(
    playerId: string
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) => ({
        ...group,
        playerIds:
          group.playerIds.filter(
            (id) => id !== playerId
          ),
        scorekeeperIds:
          group.scorekeeperIds.filter(
            (id) => id !== playerId
          )
      }))
    );

    setRoundBundle((current) => {
      const roundPlayers =
        current.roundPlayers.filter(
          (player) =>
            player.playerId !== playerId
        );

      const scorecards =
        current.scorecards.map(
          (card) => ({
            ...card,
            players:
              card.players.filter(
                (player) =>
                  player.playerId !==
                  playerId
              ),
            scorekeeperId:
              card.scorekeeperId ===
              playerId
                ? undefined
                : card.scorekeeperId
          })
        );

      const scorecardImports =
        current.scorecardImports.map(
          (scorecardImport) => ({
            ...scorecardImport,
            cells:
              scorecardImport.cells.filter(
                (cell) =>
                  cell.playerId !==
                  playerId
              ),
            issues:
              scorecardImport.issues.filter(
                (issue) =>
                  issue.playerId !==
                  playerId
              )
          })
        );

      const scorecardEntries =
        current.scorecardEntries.map(
          (scorecardEntry) => ({
            ...scorecardEntry,
            players:
              scorecardEntry.players.filter(
                (playerEntry) =>
                  playerEntry.playerId !==
                  playerId
              )
          })
        );

      return {
        ...current,
        roundPlayers,
        scorecards,
        scorecardImports,
        scorecardEntries,
        round: {
          ...current.round,
          expectedPlayerCount:
            roundPlayers.length,
          checkedInCount:
            roundPlayers.filter(
              (player) =>
                player.checkedIn
            ).length,
          paidCount:
            roundPlayers.filter(
              (player) => player.paid
            ).length,
          scorecardCount:
            scorecards.length
        }
      };
    });
  }

  function movePlayer(
    playerId: string,
    fromGroupId: string,
    toGroupId: string
  ) {
    try {
      const updatedState =
        movePlayerBetweenCards(
          {
            groups,
            roundBundle
          },
          playerId,
          fromGroupId,
          toGroupId
        );

      setGroups(updatedState.groups);
      setRoundBundle(
        updatedState.roundBundle
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The player could not be moved.';

      window.alert(message);
    }
  }

  function swapPlayers(
    firstPlayerId: string,
    secondPlayerId: string
  ) {
    try {
      const updatedState =
        swapPlayersBetweenCards(
          {
            groups,
            roundBundle
          },
          firstPlayerId,
          secondPlayerId
        );

      setGroups(updatedState.groups);
      setRoundBundle(
        updatedState.roundBundle
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The players could not be swapped.';

      window.alert(message);
    }
  }

  function changeScorekeeper(
    groupId: string,
    playerId: string
  ) {
    try {
      const updatedState =
        changeCardScorekeeper(
          {
            groups,
            roundBundle
          },
          groupId,
          playerId
        );

      setGroups(updatedState.groups);
      setRoundBundle(
        updatedState.roundBundle
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The scorekeeper could not be changed.';

      window.alert(message);
    }
  }

  function updateScorecardScore(
    scorecardId: string,
    playerId: string,
    holeNumber: number,
    grossScore: number | null
  ) {
    const scorecardEntry =
      roundBundle.scorecardEntries.find(
        (entry) =>
          entry.scorecardId ===
          scorecardId
      );

    if (!scorecardEntry) {
      window.alert(
        'The score-entry record could not be found.'
      );
      return;
    }

    try {
      const updatedEntry =
        updateGrossScore(
          scorecardEntry,
          playerId,
          holeNumber,
          grossScore,
          blackBearCourse,
          bearTrackerScoringSettings
        );

      setRoundBundle((current) => ({
        ...current,
        scorecardEntries:
          current.scorecardEntries.map(
            (entry) =>
              entry.scorecardId ===
              scorecardId
                ? updatedEntry
                : entry
          )
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The score could not be saved.';

      window.alert(message);
    }
  }

  function savePaperPlayerTotals(
  scorecardId: string,
  paperTotals: PaperPlayerTotals
) {
  const scorecardEntry =
    roundBundle.scorecardEntries.find(
      (entry) =>
        entry.scorecardId === scorecardId
    );

  if (!scorecardEntry) {
    window.alert(
      'The score-entry record could not be found.'
    );

    return;
  }

  try {
    const updatedEntry =
      updatePaperPlayerTotals(
        scorecardEntry,
        paperTotals
      );

    setRoundBundle((current) => ({
      ...current,

      scorecardEntries:
        current.scorecardEntries.map(
          (entry) =>
            entry.scorecardId === scorecardId
              ? updatedEntry
              : entry
        )
    }));
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'The paper totals could not be saved.';

    window.alert(message);
  }
}

  function verifyScorecard(
    scorecardId: string
  ) {
    const scorecardEntry =
      roundBundle.scorecardEntries.find(
        (entry) =>
          entry.scorecardId ===
          scorecardId
      );

    if (!scorecardEntry) {
      window.alert(
        'The score-entry record could not be found.'
      );
      return;
    }

    try {
      const verifiedEntry =
        markScorecardEntryVerified(
          scorecardEntry
        );

      setRoundBundle((current) => ({
        ...current,
        scorecardEntries:
          current.scorecardEntries.map(
            (entry) =>
              entry.scorecardId ===
              scorecardId
                ? verifiedEntry
                : entry
          )
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The scorecard could not be verified.';

      window.alert(message);
    }
  }

function completeRound() {
  setRoundBundle((current) => ({
    ...current,

    round: {
      ...current.round,
      state: 'completed'
    }
  }));

  window.alert(
    'Round completed successfully. (Archive processing will be added in the next sprint.)'
  );
}

  function continueCurrentRound() {
    const state = roundGuidance.state;

    if (state === 'pairings-ready') {
      setRoundBundle((current) => ({
        ...current,
        round: {
          ...current.round,
          state:
            'registration-open'
        }
      }));

      setCurrentWorkspace(
        'operations'
      );
      return;
    }

    switch (state) {
      case 'planning':
      case 'registration-open':
      case 'registration-closing':
      case 'ready-to-start':
        setCurrentWorkspace(
          'operations'
        );
        break;

      case 'round-live':
      case 'scoring-complete':
        setCurrentWorkspace(
          'tournament'
        );
        break;

      case 'payouts':
      case 'financial-closeout':
        setCurrentWorkspace(
          'finance'
        );
        break;

      case 'archived':
        setCurrentWorkspace('admin');
        break;
    }
  }

  function startNewRound() {
    const confirmed =
      window.confirm(
        'Start a new round? This will clear the current saved round and all current arrival and score-entry progress.'
      );

    if (!confirmed) {
      return;
    }

    const newRound =
      createEmptyRound(
        new Date()
          .toISOString()
          .slice(0, 10)
      );

    clearSavedCurrentRound();

    setRoundBundle(newRound);
    setGroups([]);
    setPlayerAccounts(
      initialPlayers.map((player) =>
        createPlayerAccount(player.id)
      )
    );
    setCurrentWorkspace('home');
  }

  function startRound() {
    setRoundBundle((current) => ({
      ...current,
      round: {
        ...current.round,
        state: 'round-live'
      }
    }));

    setCurrentWorkspace(
      'tournament'
    );
  }

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">
            Golf League Operating System
          </p>

          <h1>Bear Tracker</h1>

          <p>
            League operations, scoring,
            payouts, and history.
          </p>
        </div>
      </header>

      <AppShell
        activeWorkspace={
          currentWorkspace
        }
        onChangeWorkspace={
          setCurrentWorkspace
        }
      />

      {currentWorkspace === 'home' && (
        <HomeWorkspace
          guidance={roundGuidance}
          expectedCount={
            expectedCount
          }
          checkedInCount={
            checkedInCount
          }
          paidCount={paidCount}
          scorecardCount={
            scorecardCount
          }
          onContinue={
            continueCurrentRound
          }
        />
      )}

      {currentWorkspace ===
        'operations' && (
        <OperationsWorkspace
          players={players}
          groups={groups}
          expectedCount={
            expectedCount
          }
          checkedInCount={
            checkedInCount
          }
          paidCount={paidCount}
          expectedPlayerIds={
            expectedPlayerIds
          }
          checkedInPlayerIds={
            checkedInPlayerIds
          }
          paidPlayerIds={
            paidPlayerIds
          }
          onApplyPairings={
            applyPairings
          }
          onRemovePlayer={
            removePlayerFromRound
          }
          onMovePlayer={movePlayer}
          onSwapPlayers={swapPlayers}
          onChangeScorekeeper={
            changeScorekeeper
          }
          onStartRound={startRound}
          getAvailableCredit={
            getAvailableCredit
          }
          onCompleteArrival={
            completeArrival
          }
        />
      )}

      {currentWorkspace ===
        'tournament' && (
        <TournamentWorkspace
          scorecards={
            roundBundle.scorecards
          }
          scorecardEntries={
            roundBundle.scorecardEntries
          }
          players={players}
          visibility={
            bearTrackerTournamentVisibility
          }
          onUpdateScore={
            updateScorecardScore
          }
          onSavePaperTotals={
            savePaperPlayerTotals
          }
          onVerifyScorecard={
            verifyScorecard
          }
          onCompleteRound={completeRound}
        />
      )}

      {currentWorkspace ===
        'finance' && (
        <section className="card">
          <h2>
            Finance Workspace
          </h2>

          <p>
            Payouts, owed players, the
            hole-in-one fund, the extra
            fund, and financial checks
            will live here.
          </p>
        </section>
      )}

      {currentWorkspace ===
        'league' && (
        <section className="card">
          <h2>
            League Manager Workspace
          </h2>

          <p>
            Signups, pairings, tee times,
            publishing, and
            communications will live
            here.
          </p>
        </section>
      )}

      {currentWorkspace ===
        'admin' && (
        <section className="card">
          <h2>
            Administration Workspace
          </h2>

          <p>
            Players, rules, GHIN,
            courses, seasons, reports,
            and system controls.
          </p>

          <button
            type="button"
            onClick={startNewRound}
          >
            Start New Round
          </button>
        </section>
      )}
    </main>
  );
}