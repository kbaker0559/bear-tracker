import { useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import HomeWorkspace from './components/HomeWorkspace';
import OperationsWorkspace from './components/OperationsWorkspace';
import TournamentWorkspace from './components/TournamentWorkspace';
import DeveloperTools from './components/DeveloperTools';
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
  createBenchmark,
  loadBenchmark
} from './engine/benchmarkEngine';
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
  deleteBenchmark,
  getBenchmark,
  listBenchmarks,
  saveBenchmark
} from './storage/benchmarkStorage';
import {
  createPlayerScoreEntry,
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
import type { RoundPlayerStatus } from './types/roundPlayer';
import type { BenchmarkSummary } from './types/benchmark';
import type { PaperPlayerTotals } from './types/paperScorecardTotals';
import type { TournamentEvent, TournamentEventType } from './types/tournamentEvent';
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
  paidByPlayerId?: string;
  note?: string;
};

const ENTRY_FEE = 25;

function createTournamentEvent(
  roundId: string,
  type: TournamentEventType,
  summary: string,
  details: Omit<
    TournamentEvent,
    'id' | 'roundId' | 'type' | 'occurredAt' | 'summary'
  > = {}
): TournamentEvent {
  return {
    id: crypto.randomUUID(),
    roundId,
    type,
    occurredAt: new Date().toISOString(),
    summary,
    ...details
  };
}

export default function App() {
  const [currentWorkspace, setCurrentWorkspace] =
    useState<Workspace>('home');

  const [players] =
    useState<Player[]>(initialPlayers);

  const [
  benchmarkSummaries,
  setBenchmarkSummaries
] = useState<BenchmarkSummary[]>(
  () => listBenchmarks()
);  

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

  const activeRoundPlayers =
    roundBundle.roundPlayers.filter(
      (player) =>
        player.status !== 'dns' &&
        player.status !== 'no-show' &&
        player.status !== 'withdrawn' &&
        player.status !== 'removed'
    );

  const expectedPlayerIds =
    activeRoundPlayers.map(
      (player) => player.playerId
    );

  const checkedInPlayerIds =
    activeRoundPlayers
      .filter((player) => player.checkedIn)
      .map((player) => player.playerId);

  const paidPlayerIds =
    activeRoundPlayers
      .filter((player) => player.paid)
      .map((player) => player.playerId);

  const weeklyPlayers =
    roundBundle.roundPlayers.map((roundPlayer) => {
      const scorecard =
        roundBundle.scorecards.find(
          (card) => card.id === roundPlayer.scorecardId
        );

      const scorecardPlayer =
        scorecard?.players.find(
          (player) =>
            player.playerId === roundPlayer.playerId
        );

      const scoreEntry =
        roundBundle.scorecardEntries
          .find(
            (entry) =>
              entry.scorecardId === roundPlayer.scorecardId
          )
          ?.players.find(
            (entry) =>
              entry.playerId === roundPlayer.playerId
          );

      const profile = players.find(
        (player) => player.id === roundPlayer.playerId
      );

      return {
        playerId: roundPlayer.playerId,
        handicap:
          scorecardPlayer?.handicapAtPairing ??
          scoreEntry?.courseHandicap ??
          profile?.handicap ??
          0,
        quota:
          scorecardPlayer?.quotaAtPairing ??
          scoreEntry?.quota ??
          profile?.quota ??
          0,
        status: roundPlayer.status,
        reviewed: roundPlayer.weeklyReviewed ?? false
      };
    });

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
                  player?.handicap ?? 0,
                quotaAtPairing:
                  player?.quota ?? 0
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

  function refreshBenchmarkList() {
  setBenchmarkSummaries(
    listBenchmarks()
  );
}

function createCurrentRoundBenchmark() {
  const name = window.prompt(
    'Benchmark name:',
    `${roundBundle.round.date} Benchmark`
  );

  if (!name?.trim()) {
    return;
  }

  const description =
    window.prompt(
      'Benchmark description:',
      `${roundBundle.roundPlayers.length} players and ${roundBundle.scorecards.length} scorecards`
    ) ?? '';

  try {
    const benchmark =
      createBenchmark(
        name.trim(),
        description.trim(),
        roundBundle
      );

    saveBenchmark(benchmark);
    refreshBenchmarkList();

    window.alert(
      'Benchmark saved successfully.'
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'The benchmark could not be saved.';

    window.alert(message);
  }
}

function loadSavedBenchmark(
  benchmarkId: string
) {
  const benchmark =
    getBenchmark(benchmarkId);

  if (!benchmark) {
    window.alert(
      'The benchmark could not be found.'
    );

    return;
  }

  const confirmed =
    window.confirm(
      `Load "${benchmark.name}"? This will replace the current round.`
    );

  if (!confirmed) {
    return;
  }

  const loadedRound =
    loadBenchmark(benchmark);

  const loadedGroups: Group[] =
    loadedRound.scorecards.map(
      (scorecard) => ({
        id: scorecard.id,
        name: `Group ${scorecard.cardNumber}`,
        playerIds:
          scorecard.players.map(
            (player) => player.playerId
          ),
        scorekeeperIds:
          scorecard.scorekeeperId
            ? [scorecard.scorekeeperId]
            : []
      })
    );

  setRoundBundle(loadedRound);
  setGroups(loadedGroups);
  setCurrentWorkspace('tournament');
}

function removeSavedBenchmark(
  benchmarkId: string
) {
  const benchmark =
    getBenchmark(benchmarkId);

  if (!benchmark) {
    return;
  }

  const confirmed =
    window.confirm(
      `Delete "${benchmark.name}"?`
    );

  if (!confirmed) {
    return;
  }

  deleteBenchmark(benchmarkId);
  refreshBenchmarkList();
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
                    payment.paidByPlayerId,
                  paymentNote:
                    payment.note
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

  function addTournamentNote(note: string) {
    const trimmed = note.trim();

    if (!trimmed) {
      return;
    }

    setRoundBundle((current) => ({
      ...current,
      tournamentEvents: [
        ...(current.tournamentEvents ?? []),
        createTournamentEvent(
          current.round.id,
          'note',
          'Round note added',
          { note: trimmed }
        )
      ]
    }));
  }

  function setPlayerInactiveStatus(
    playerId: string,
    status: Extract<
      RoundPlayerStatus,
      'dns' | 'withdrawn' | 'removed'
    >,
    reason: string
  ) {
    setGroups((currentGroups) =>
      currentGroups.map((group) => ({
        ...group,
        playerIds: group.playerIds.filter(
          (id) => id !== playerId
        ),
        scorekeeperIds: group.scorekeeperIds.filter(
          (id) => id !== playerId
        )
      }))
    );

    setRoundBundle((current) => {
      const currentRoundPlayer =
        current.roundPlayers.find(
          (player) => player.playerId === playerId
        );

      const currentCard = current.scorecards.find(
        (card) =>
          card.players.some(
            (player) => player.playerId === playerId
          )
      );

      const cardPlayer = currentCard?.players.find(
        (player) => player.playerId === playerId
      );

      const roundPlayers = current.roundPlayers.map(
        (player) =>
          player.playerId === playerId
            ? {
                ...player,
                status,
                statusReason: reason || undefined,
                originalScorecardId:
                  player.originalScorecardId ??
                  player.scorecardId ??
                  currentCard?.id,
                storedHandicapAtPairing:
                  player.storedHandicapAtPairing ??
                  cardPlayer?.handicapAtPairing,
                storedQuotaAtPairing:
                  player.storedQuotaAtPairing ??
                  cardPlayer?.quotaAtPairing,
                originalScorekeeperForScorecardId:
                  player.originalScorekeeperForScorecardId ??
                  player.scorekeeperForScorecardId,
                isEligibleForPlaces: false,
                isEligibleForSkins: false,
                isEligibleForGreenies: false,
                isEligibleForHorseAss: false
              }
            : player
      );

      const scorecards = current.scorecards.map((card) => ({
        ...card,
        players: card.players.filter(
          (player) => player.playerId !== playerId
        ),
        scorekeeperId:
          card.scorekeeperId === playerId
            ? undefined
            : card.scorekeeperId
      }));

      const scorecardEntries =
        current.scorecardEntries.map((entry) => ({
          ...entry,
          players: entry.players.filter(
            (player) => player.playerId !== playerId
          ),
          paperTotals: (entry.paperTotals ?? []).filter(
            (paper) => paper.playerId !== playerId
          )
        }));

      const activePlayers = roundPlayers.filter(
        (player) =>
          player.status !== 'dns' &&
          player.status !== 'withdrawn' &&
          player.status !== 'removed' &&
          player.status !== 'no-show'
      );

      const profileName =
        players.find((player) => player.id === playerId)
          ?.name ?? playerId;

      const statusSummary =
        status === 'dns'
          ? `${profileName} marked DNS`
          : status === 'withdrawn'
            ? `${profileName} withdrawn`
            : `${profileName} removed from round`;

      return {
        ...current,
        roundPlayers,
        scorecards,
        scorecardEntries,
        tournamentEvents: [
          ...(current.tournamentEvents ?? []),
          createTournamentEvent(
            current.round.id,
            status,
            statusSummary,
            {
              playerIds: [playerId],
              scorecardId:
                currentRoundPlayer?.scorecardId ??
                currentCard?.id,
              note: reason || undefined
            }
          )
        ],
        round: {
          ...current.round,
          expectedPlayerCount: activePlayers.length,
          checkedInCount: activePlayers.filter(
            (player) => player.checkedIn
          ).length,
          paidCount: activePlayers.filter(
            (player) => player.paid
          ).length
        }
      };
    });
  }

  function restorePlayerToRound(playerId: string) {
    const roundPlayer = roundBundle.roundPlayers.find(
      (player) => player.playerId === playerId
    );

    if (!roundPlayer) {
      window.alert(
        'This player is no longer in the round history. Use Add Player Back to Round.'
      );
      return;
    }

    const targetCardId =
      roundPlayer.originalScorecardId ??
      roundPlayer.scorecardId;

    if (!targetCardId) {
      window.alert(
        'The original card could not be determined. Use Add Player Back to Round.'
      );
      return;
    }

    const profile = players.find(
      (player) => player.id === playerId
    );

    if (!profile) return;

    const handicap =
      roundPlayer.storedHandicapAtPairing ??
      profile.handicap;
    const quota =
      roundPlayer.storedQuotaAtPairing ??
      profile.quota;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === targetCardId &&
        !group.playerIds.includes(playerId)
          ? {
              ...group,
              playerIds: [...group.playerIds, playerId]
            }
          : group
      )
    );

    setRoundBundle((current) => {
      const scorecards = current.scorecards.map((card) =>
        card.id === targetCardId &&
        !card.players.some(
          (player) => player.playerId === playerId
        )
          ? {
              ...card,
              players: [
                ...card.players,
                {
                  playerId,
                  tee: '',
                  handicapAtPairing: handicap,
                  quotaAtPairing: quota
                }
              ]
            }
          : card
      );

      const scorecardEntries =
        current.scorecardEntries.map((entry) =>
          entry.scorecardId === targetCardId &&
          !entry.players.some(
            (player) => player.playerId === playerId
          )
            ? {
                ...entry,
                status: 'not-started' as const,
                players: [
                  ...entry.players,
                  createPlayerScoreEntry(
                    playerId,
                    handicap,
                    quota,
                    players
                  )
                ]
              }
            : entry
        );

      const roundPlayers = current.roundPlayers.map(
        (player) =>
          player.playerId === playerId
            ? {
                ...player,
                status: player.checkedIn
                  ? ('checked-in' as const)
                  : ('expected' as const),
                statusReason: undefined,
                scorecardId: targetCardId,
                isEligibleForPlaces: true,
                isEligibleForSkins: true,
                isEligibleForGreenies: true,
                isEligibleForHorseAss: true
              }
            : player
      );

      const activePlayers = roundPlayers.filter(
        (player) =>
          player.status !== 'dns' &&
          player.status !== 'withdrawn' &&
          player.status !== 'removed' &&
          player.status !== 'no-show'
      );

      const profileName = profile.name;

      return {
        ...current,
        roundPlayers,
        scorecards,
        scorecardEntries,
        tournamentEvents: [
          ...(current.tournamentEvents ?? []),
          createTournamentEvent(
            current.round.id,
            'restored',
            `${profileName} restored to round`,
            {
              playerIds: [playerId],
              scorecardId: targetCardId
            }
          )
        ],
        round: {
          ...current.round,
          expectedPlayerCount: activePlayers.length,
          checkedInCount: activePlayers.filter(
            (player) => player.checkedIn
          ).length,
          paidCount: activePlayers.filter(
            (player) => player.paid
          ).length
        }
      };
    });
  }

  function addPlayerBackToRound(
    playerId: string,
    groupId: string,
    handicap: number,
    quota: number,
    additionType: 'late-add' | 'restore-missing',
    note: string
  ) {
    const profile = players.find(
      (player) => player.id === playerId
    );

    if (!profile) return;

    setGroups((currentGroups) =>
      currentGroups.map((group) =>
        group.id === groupId
          ? {
              ...group,
              playerIds: group.playerIds.includes(playerId)
                ? group.playerIds
                : [...group.playerIds, playerId]
            }
          : group
      )
    );

    setRoundBundle((current) => {
      const scorecards = current.scorecards.map((card) =>
        card.id === groupId
          ? {
              ...card,
              players: card.players.some(
                (player) => player.playerId === playerId
              )
                ? card.players
                : [
                    ...card.players,
                    {
                      playerId,
                      tee: '',
                      handicapAtPairing: handicap,
                      quotaAtPairing: quota
                    }
                  ]
            }
          : card
      );

      const scorecardEntries =
        current.scorecardEntries.map((entry) =>
          entry.scorecardId === groupId
            ? {
                ...entry,
                status: 'not-started' as const,
                players: entry.players.some(
                  (player) => player.playerId === playerId
                )
                  ? entry.players
                  : [
                      ...entry.players,
                      createPlayerScoreEntry(
                        playerId,
                        handicap,
                        quota,
                        players
                      )
                    ]
              }
            : entry
        );

      const newRoundPlayer = {
        roundId: current.round.id,
        playerId,
        status: 'expected' as const,
        weeklyReviewed: true,
        checkedIn: false,
        paid: false,
        scorecardId: groupId,
        originalScorecardId: groupId,
        storedHandicapAtPairing: handicap,
        storedQuotaAtPairing: quota,
        isEligibleForPlaces: true,
        isEligibleForSkins: true,
        isEligibleForGreenies: true,
        isEligibleForHorseAss: true,
        amountPaid: 0,
        cashPaid: 0,
        creditApplied: 0,
        amountWon: 0,
        amountOwed: 0
      };

      const roundPlayers = [
        ...current.roundPlayers,
        newRoundPlayer
      ];

      return {
        ...current,
        roundPlayers,
        scorecards,
        scorecardEntries,
        tournamentEvents: [
          ...(current.tournamentEvents ?? []),
          createTournamentEvent(
            current.round.id,
            additionType === 'late-add'
              ? 'late-add'
              : 'restored',
            additionType === 'late-add'
              ? `${profile.name} added as a late player`
              : `${profile.name} restored to round`,
            {
              playerIds: [playerId],
              scorecardId: groupId,
              note: note || undefined
            }
          )
        ],
        round: {
          ...current.round,
          expectedPlayerCount:
            current.round.expectedPlayerCount + 1
        }
      };
    });
  }

  function updateWeeklyPlayer(
    playerId: string,
    handicap: number,
    quota: number
  ) {
    const playerEntry =
      roundBundle.scorecardEntries
        .flatMap((entry) => entry.players)
        .find((entry) => entry.playerId === playerId);

    const scoreAlreadyEntered =
      playerEntry?.scores.some(
        (score) => score.grossScore !== null
      ) ?? false;

    if (scoreAlreadyEntered) {
      window.alert(
        'Weekly handicap and Points Needed cannot be changed after scores have been entered for this player. Clear the player scores first.'
      );
      return;
    }

    setRoundBundle((current) => ({
      ...current,
      roundPlayers: current.roundPlayers.map((player) =>
        player.playerId === playerId
          ? {
              ...player,
              weeklyReviewed: true
            }
          : player
      ),
      scorecards: current.scorecards.map((card) => ({
        ...card,
        players: card.players.map((player) =>
          player.playerId === playerId
            ? {
                ...player,
                handicapAtPairing: handicap,
                quotaAtPairing: quota
              }
            : player
        )
      })),
      scorecardEntries:
        current.scorecardEntries.map((entry) => ({
          ...entry,
          players: entry.players.map((player) =>
            player.playerId === playerId
              ? {
                  ...player,
                  courseHandicap: handicap,
                  quota,
                  quotaResult:
                    player.stablefordPoints !== null
                      ? player.stablefordPoints - quota
                      : null
                }
              : player
          )
        }))
    }));
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
      setRoundBundle({
        ...updatedState.roundBundle,
        tournamentEvents: [
          ...(updatedState.roundBundle.tournamentEvents ?? []),
          createTournamentEvent(
            updatedState.roundBundle.round.id,
            'player-moved',
            `${players.find((player) => player.id === playerId)?.name ?? playerId} moved to another card`,
            {
              playerIds: [playerId],
              fromScorecardId: fromGroupId,
              toScorecardId: toGroupId
            }
          )
        ]
      });
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
      setRoundBundle({
        ...updatedState.roundBundle,
        tournamentEvents: [
          ...(updatedState.roundBundle.tournamentEvents ?? []),
          createTournamentEvent(
            updatedState.roundBundle.round.id,
            'players-swapped',
            'Players swapped between cards',
            {
              playerIds: [firstPlayerId, secondPlayerId]
            }
          )
        ]
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'The players could not be swapped.';

      window.alert(message);
    }
  }

  function reorderScorecardPlayers(
    groupId: string,
    orderedPlayerIds: string[]
  ) {
    const group = groups.find(
      (candidate) => candidate.id === groupId
    );

    if (!group) {
      window.alert(
        'The scorecard could not be found.'
      );
      return;
    }

    const samePlayers =
      orderedPlayerIds.length ===
        group.playerIds.length &&
      orderedPlayerIds.every((playerId) =>
        group.playerIds.includes(playerId)
      );

    if (!samePlayers) {
      window.alert(
        'The scorecard order could not be saved because the player list changed.'
      );
      return;
    }

    setGroups((currentGroups) =>
      currentGroups.map((currentGroup) =>
        currentGroup.id === groupId
          ? {
              ...currentGroup,
              playerIds: [...orderedPlayerIds]
            }
          : currentGroup
      )
    );

    setRoundBundle((current) => ({
      ...current,
      tournamentEvents: [
        ...(current.tournamentEvents ?? []),
        createTournamentEvent(
          current.round.id,
          'scorecard-reordered',
          'Scorecard player order changed',
          { scorecardId: groupId }
        )
      ],
      scorecards: current.scorecards.map((card) =>
        card.id === groupId
          ? {
              ...card,
              players: orderedPlayerIds
                .map((playerId) =>
                  card.players.find(
                    (player) =>
                      player.playerId === playerId
                  )
                )
                .filter(
                  (player): player is typeof card.players[number] =>
                    player !== undefined
                )
            }
          : card
      ),
      scorecardEntries:
        current.scorecardEntries.map((entry) =>
          entry.scorecardId === groupId
            ? {
                ...entry,
                players: orderedPlayerIds
                  .map((playerId) =>
                    entry.players.find(
                      (player) =>
                        player.playerId === playerId
                    )
                  )
                  .filter(
                    (player): player is typeof entry.players[number] =>
                      player !== undefined
                  )
              }
            : entry
        )
    }));
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
      setRoundBundle({
        ...updatedState.roundBundle,
        tournamentEvents: [
          ...(updatedState.roundBundle.tournamentEvents ?? []),
          createTournamentEvent(
            updatedState.roundBundle.round.id,
            'scorekeeper-changed',
            `${players.find((player) => player.id === playerId)?.name ?? playerId} assigned as scorekeeper`,
            {
              playerIds: [playerId],
              scorecardId: groupId
            }
          )
        ]
      });
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
          weeklyPlayers={weeklyPlayers}
          roundPlayers={roundBundle.roundPlayers}
          tournamentEvents={roundBundle.tournamentEvents ?? []}
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
          onSetInactiveStatus={
            setPlayerInactiveStatus
          }
          onRestorePlayer={
            restorePlayerToRound
          }
          onAddPlayerBack={
            addPlayerBackToRound
          }
          onUpdateWeeklyPlayer={
            updateWeeklyPlayer
          }
          onMovePlayer={movePlayer}
          onSwapPlayers={swapPlayers}
          onChangeScorekeeper={
            changeScorekeeper
          }
          onReorderScorecard={
            reorderScorecardPlayers
          }
          onStartRound={startRound}
          getAvailableCredit={
            getAvailableCredit
          }
          onCompleteArrival={
            completeArrival
          }
          onAddTournamentNote={
            addTournamentNote
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
         <DeveloperTools
  benchmarks={benchmarkSummaries}
  onCreateBenchmark={
    createCurrentRoundBenchmark
  }
  onLoadBenchmark={
    loadSavedBenchmark
  }
  onDeleteBenchmark={
    removeSavedBenchmark
  }
/> 
        </section>
      )}
    </main>
  );
}