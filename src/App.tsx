import { useCallback, useEffect, useState } from 'react';
import AppShell from './components/AppShell';
import HomeWorkspace from './components/HomeWorkspace';
import OperationsWorkspace from './components/OperationsWorkspace';
import TournamentWorkspace from './components/TournamentWorkspace';
import ResultsWorkspace from './components/ResultsWorkspace';
import TreasurerWorkspace from './components/TreasurerWorkspace';
import FinalizeWorkspace from './components/FinalizeWorkspace';
import QuotaWorkspace from './components/QuotaWorkspace';
import DeveloperTools from './components/DeveloperTools';
import AIRecognitionSettings from './components/AIRecognitionSettings';
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
import type { ResultsSettings } from './types/resultsSettings';
import { buildAwardEntries } from './engine/awardEntryEngine';
import {
  bearTrackerTournamentVisibility
} from './types/tournamentVisibility';
import './styles.css';
import type { TreasuryReconciliation } from './types/treasuryReconciliation';
import { getFinalizeReadiness } from './engine/finalizeReadinessEngine';
import { getMissionControl } from './engine/missionControlEngine';
import { buildQuotaUpdates } from './engine/quotaUpdateEngine';
import type { NavigationSection } from './types/navigation';
import type { ScoreConfidence, ScorecardImportIssue } from './types/scorecardImport';
import { recognizeScorecard, recognizeScorecardIdentity } from './services/aiScorecardService';
import { matchRecognizedPlayerName } from './services/playerNameMatching';
import type { ScorecardIdentityReview } from './types/aiScorecard';

type Workspace =
  | 'home'
  | 'operations'
  | 'tournament'
  | 'results'
  | 'finance'
  | 'quotas'
  | 'finalize'
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

const SCORECARD_PHOTO_MAX_DIMENSION = 2200;
const SCORECARD_PHOTO_QUALITY = 0.86;

async function prepareScorecardPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file.');
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const candidate = new Image();
      candidate.onload = () => resolve(candidate);
      candidate.onerror = () =>
        reject(new Error('The selected image could not be opened.'));
      candidate.src = objectUrl;
    });

    const scale = Math.min(
      1,
      SCORECARD_PHOTO_MAX_DIMENSION /
        Math.max(image.naturalWidth, image.naturalHeight)
    );
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('The browser could not prepare the scorecard photo.');
    }

    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', SCORECARD_PHOTO_QUALITY);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export default function App() {
  const [currentWorkspace, setCurrentWorkspace] =
    useState<Workspace>('home');
  const [navigationSection, setNavigationSection] =
    useState<NavigationSection | undefined>(undefined);


  const navigateToWorkspace = useCallback((
    workspace: Workspace,
    section?: NavigationSection
  ) => {
    setNavigationSection(section);
    setCurrentWorkspace(workspace);
  }, []);

  const clearNavigationSection = useCallback(() => {
    setNavigationSection(undefined);
  }, []);

  const [savedCurrentRound] = useState(() =>
    loadCurrentRound()
  );

  const [players, setPlayers] =
    useState<Player[]>(() =>
      savedCurrentRound?.leaguePlayers ?? initialPlayers
    );

  const [
  benchmarkSummaries,
  setBenchmarkSummaries
] = useState<BenchmarkSummary[]>(
  () => listBenchmarks()
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
      playerAccounts,
      leaguePlayers: players
    });
  }, [
    roundBundle,
    groups,
    playerAccounts,
    players
  ]);

  useEffect(() => {
    if (roundBundle.round.finalizedAt) {
      return;
    }

    setRoundBundle((current) => {
      const nextQuotaUpdates = buildQuotaUpdates(
        current.round.id,
        current.roundPlayers,
        current.scorecardEntries,
        current.quotaUpdates ?? []
      );

      if (
        JSON.stringify(nextQuotaUpdates) ===
        JSON.stringify(current.quotaUpdates ?? [])
      ) {
        return current;
      }

      return {
        ...current,
        quotaUpdates: nextQuotaUpdates
      };
    });
  }, [
    roundBundle.roundPlayers,
    roundBundle.scorecardEntries,
    roundBundle.resultsSettings,
    roundBundle.round.finalizedAt
  ]);

  useEffect(() => {
    if (roundBundle.round.finalizedAt) {
      return;
    }

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

  const missionControl = getMissionControl(roundBundle, players);
  const recentTournamentEvents = [...(roundBundle.tournamentEvents ?? [])]
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 6);

  const finalizeReadiness = getFinalizeReadiness(roundBundle);
  const roundIsFinalized = Boolean(roundBundle.round.finalizedAt);

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

  const weeklyPlayers = players
    .filter((player) => player.active)
    .map((profile) => {
      const roundPlayer = roundBundle.roundPlayers.find(
        (entry) => entry.playerId === profile.id
      );
      const scorecard = roundBundle.scorecards.find(
        (card) => card.id === roundPlayer?.scorecardId
      );
      const scorecardPlayer = scorecard?.players.find(
        (entry) => entry.playerId === profile.id
      );
      const scoreEntry = roundBundle.scorecardEntries
        .find((entry) => entry.scorecardId === roundPlayer?.scorecardId)
        ?.players.find((entry) => entry.playerId === profile.id);
      const reviewedIds = roundBundle.round.weeklyReviewedPlayerIds ?? [];

      return {
        playerId: profile.id,
        handicap: scorecardPlayer?.handicapAtPairing ?? scoreEntry?.courseHandicap ?? profile.handicap,
        quota: scorecardPlayer?.quotaAtPairing ?? scoreEntry?.quota ?? profile.quota,
        status: roundPlayer?.status ?? 'not-playing',
        playingThisWeek: Boolean(roundPlayer),
        reviewed: reviewedIds.includes(profile.id) || Boolean(roundPlayer?.weeklyReviewed)
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
    setRoundBundle({
      ...createdRound,
      round: {
        ...createdRound.round,
        playerStatusReviewedAt: undefined,
        cardOrderReviewedAt: undefined
      }
    });
  }

  function completePlayerStatusReview() {
    setRoundBundle((current) => ({
      ...current,
      round: {
        ...current.round,
        playerStatusReviewedAt: new Date().toISOString(),
        cardOrderReviewedAt: undefined
      }
    }));
  }

  function completeCardOrderReview() {
    setRoundBundle((current) => ({
      ...current,
      round: {
        ...current.round,
        cardOrderReviewedAt: new Date().toISOString()
      }
    }));
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

    const creditToHoleInOne =
      payment.creditApplied > 0 ? 1 : 0;
    const creditToPrizePot =
      payment.creditApplied - creditToHoleInOne;
    const cashToHoleInOne =
      payment.creditApplied > 0 ? 0 : 1;
    const cashToPrizePot =
      payment.cashPaid - cashToHoleInOne;

    if (payment.creditApplied > 0) {
      const playerName =
        players.find((player) => player.id === playerId)?.name ??
        playerId;

      if (creditToPrizePot > 0) {
        const prizeMoved = window.confirm(
          `Move $${creditToPrizePot} from ${playerName}'s Owe envelope to the Tournament Prize Pot. Click OK only after the cash has been moved.`
        );

        if (!prizeMoved) {
          return;
        }
      }

      if (creditToHoleInOne > 0) {
        const holeInOneMoved = window.confirm(
          `Move $${creditToHoleInOne} from ${playerName}'s Owe envelope to the Hole-in-One Pot. Click OK only after the cash has been moved.`
        );

        if (!holeInOneMoved) {
          return;
        }
      }
    }

    const createdAt = new Date().toISOString();

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

      const entryTransactions = [];

      if (cashToPrizePot > 0) {
        entryTransactions.push({
          id: crypto.randomUUID(),
          type: 'entry-cash-received' as const,
          roundId: current.round.id,
          playerId,
          amount: cashToPrizePot,
          source: 'outside' as const,
          destination: 'current-round-pot' as const,
          reason: 'Tournament prize portion of entry fee',
          createdAt,
          createdBy: 'Kevin Baker'
        });
      }

      if (cashToHoleInOne > 0) {
        entryTransactions.push({
          id: crypto.randomUUID(),
          type: 'entry-cash-received' as const,
          roundId: current.round.id,
          playerId,
          amount: cashToHoleInOne,
          source: 'outside' as const,
          destination: 'hole-in-one-pot' as const,
          reason: 'Hole-in-One portion of entry fee',
          createdAt,
          createdBy: 'Kevin Baker'
        });
      }

      if (creditToPrizePot > 0) {
        entryTransactions.push({
          id: crypto.randomUUID(),
          type: 'owe-envelope-to-round-pot' as const,
          roundId: current.round.id,
          playerId,
          amount: creditToPrizePot,
          source: 'owe-envelope' as const,
          destination: 'current-round-pot' as const,
          reason: 'League credit applied to tournament prize portion',
          createdAt,
          createdBy: 'Kevin Baker'
        });
      }

      if (creditToHoleInOne > 0) {
        entryTransactions.push({
          id: crypto.randomUUID(),
          type: 'owe-envelope-to-hole-in-one-pot' as const,
          roundId: current.round.id,
          playerId,
          amount: creditToHoleInOne,
          source: 'owe-envelope' as const,
          destination: 'hole-in-one-pot' as const,
          reason: 'League credit applied to Hole-in-One portion',
          createdAt,
          createdBy: 'Kevin Baker'
        });
      }

      return {
        ...current,
        roundPlayers,
        treasuryTransactions: [
          ...(current.treasuryTransactions ?? []),
          ...entryTransactions
        ],
        tournamentEvents:
          payment.creditApplied > 0
            ? [
                ...(current.tournamentEvents ?? []),
                createTournamentEvent(
                  current.round.id,
                  'note',
                  `$${payment.creditApplied} credit applied: $${creditToPrizePot} moved to Tournament Prize Pot and $${creditToHoleInOne} moved to Hole-in-One Pot`,
                  { playerIds: [playerId] }
                )
              ]
            : current.tournamentEvents ?? [],
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
                        `League credit applied to entry fee ($${creditToPrizePot} prize pot / $${creditToHoleInOne} Hole-in-One)`,
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
          cardOrderReviewedAt: undefined,
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
          cardOrderReviewedAt: undefined,
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

    setPlayers((current) =>
      current.map((player) =>
        player.id === playerId
          ? { ...player, handicap, quota }
          : player
      )
    );

    setRoundBundle((current) => ({
      ...current,
      round: {
        ...current.round,
        weeklyReviewedPlayerIds: Array.from(new Set([
          ...(current.round.weeklyReviewedPlayerIds ?? []),
          playerId
        ]))
      },
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
        round: {
          ...updatedState.roundBundle.round,
          cardOrderReviewedAt: undefined
        },
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
        round: {
          ...updatedState.roundBundle.round,
          cardOrderReviewedAt: undefined
        },
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
      round: {
        ...current.round,
        cardOrderReviewedAt: undefined
      },
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


function updateResultsSettings(
  updater: (current: ResultsSettings) => ResultsSettings
) {
  setRoundBundle((current) => ({
    ...current,
    resultsSettings: updater(current.resultsSettings)
  }));
}


function syncAwardEntries() {
  setRoundBundle((current) => ({
    ...current,
    awardEntries: buildAwardEntries(
      current.round.id,
      current.roundPlayers,
      current.scorecardEntries,
      current.resultsSettings,
      current.awardEntries ?? []
    )
  }));
}

function updateTreasuryReconciliation(
  value: TreasuryReconciliation
) {
  setRoundBundle((current) => ({
    ...current,
    treasuryReconciliation: value
  }));
}

function settleAward(
  awardEntryId: string,
  destination: 'paid-cash' | 'moved-to-owe-envelope'
) {
  const award = buildAwardEntries(
    roundBundle.round.id,
    roundBundle.roundPlayers,
    roundBundle.scorecardEntries,
    roundBundle.resultsSettings,
    roundBundle.awardEntries ?? []
  ).find((entry) => entry.id === awardEntryId);

  if (!award || award.settlementStatus !== 'unsettled') return;

  const name = players.find((player) => player.id === award.playerId)?.name ?? award.playerId;
  if (destination === 'moved-to-owe-envelope') {
    const confirmed = window.confirm(
      `Place $${award.officialAmount} in the Owe envelope for ${name}. Confirm after the cash is physically in the envelope.`
    );
    if (!confirmed) return;
  }

  const transactionId = crypto.randomUUID();
  const settledAt = new Date().toISOString();

  setRoundBundle((current) => {
    const currentAwards = buildAwardEntries(
      current.round.id,
      current.roundPlayers,
      current.scorecardEntries,
      current.resultsSettings,
      current.awardEntries ?? []
    );
    return {
      ...current,
      awardEntries: currentAwards.map((entry) =>
        entry.id === awardEntryId
          ? { ...entry, settlementStatus: destination, settledAt, treasuryTransactionId: transactionId }
          : entry
      ),
      treasuryReconciliation: {
        ...current.treasuryReconciliation,
        reconciledAt: undefined
      },
      treasuryTransactions: [
        ...(current.treasuryTransactions ?? []),
        {
          id: transactionId,
          type: destination === 'paid-cash' ? 'award-paid-cash' : 'award-moved-to-owe-envelope',
          roundId: current.round.id,
          playerId: award.playerId,
          awardEntryId: award.id,
          amount: award.officialAmount,
          source: 'current-round-pot',
          destination: destination === 'paid-cash' ? 'paid-out' : 'owe-envelope',
          reason: award.label,
          createdAt: settledAt,
          createdBy: 'Kevin Baker'
        }
      ],
      tournamentEvents: [
        ...(current.tournamentEvents ?? []),
        createTournamentEvent(
          current.round.id,
          'note',
          destination === 'paid-cash'
            ? `${name} paid $${award.officialAmount} for ${award.label}`
            : `$${award.officialAmount} placed in ${name}'s Owe envelope for ${award.label}`,
          { playerIds: [award.playerId] }
        )
      ]
    };
  });

  if (destination === 'moved-to-owe-envelope') {
    setPlayerAccounts((current) => current.map((account) =>
      account.playerId === award.playerId
        ? addLedgerEntry(account, {
            playerId: award.playerId,
            date: roundBundle.round.date,
            type: 'winnings',
            description: `${award.label} moved to Owe envelope`,
            amount: award.officialAmount,
            roundId: roundBundle.round.id
          })
        : account
    ));

    window.alert(
      `$${award.officialAmount} moved to ${name}'s Owe envelope and added to league credit.`
    );
  } else {
    window.alert(
      `${name} was marked paid $${award.officialAmount} in cash.`
    );
  }
}

function settleCategoryCash(category: 'greenie' | 'places-ha' | 'skin') {
  syncAwardEntries();
  const awards = buildAwardEntries(
    roundBundle.round.id,
    roundBundle.roundPlayers,
    roundBundle.scorecardEntries,
    roundBundle.resultsSettings,
    roundBundle.awardEntries ?? []
  ).filter((entry) =>
    entry.settlementStatus === 'unsettled' &&
    (category === 'places-ha'
      ? entry.category === 'place' || entry.category === 'horse-ass'
      : entry.category === category)
  );
  if (awards.length === 0) return;
  const total = awards.reduce((sum, entry) => sum + entry.officialAmount, 0);
  if (!window.confirm(`Mark ${awards.length} remaining awards totaling $${total} as paid in cash?`)) return;
  const settledAt = new Date().toISOString();
  const ids = new Set(awards.map((entry) => entry.id));
  setRoundBundle((current) => {
    const currentAwards = buildAwardEntries(current.round.id, current.roundPlayers, current.scorecardEntries, current.resultsSettings, current.awardEntries ?? []);
    const transactions = awards.map((award) => ({
      id: crypto.randomUUID(),
      type: 'award-paid-cash' as const,
      roundId: current.round.id,
      playerId: award.playerId,
      awardEntryId: award.id,
      amount: award.officialAmount,
      source: 'current-round-pot' as const,
      destination: 'paid-out' as const,
      reason: award.label,
      createdAt: settledAt,
      createdBy: 'Kevin Baker'
    }));
    const txByAward = new Map(transactions.map((tx) => [tx.awardEntryId, tx.id]));
    return {
      ...current,
      awardEntries: currentAwards.map((entry) => ids.has(entry.id)
        ? { ...entry, settlementStatus: 'paid-cash', settledAt, treasuryTransactionId: txByAward.get(entry.id) }
        : entry),
      treasuryReconciliation: {
        ...current.treasuryReconciliation,
        reconciledAt: undefined
      },
      treasuryTransactions: [...(current.treasuryTransactions ?? []), ...transactions],
      tournamentEvents: [
        ...(current.tournamentEvents ?? []),
        createTournamentEvent(current.round.id, 'note', `${category === 'places-ha' ? "Places / Horse's Ass" : category === 'greenie' ? 'Greenies' : 'Skins'} batch paid: $${total}`)
      ]
    };
  });

  const label =
    category === 'places-ha'
      ? "Places / Horse's Ass"
      : category === 'greenie'
        ? 'Greenies'
        : 'Skins';

  window.alert(
    `${label} complete. ${awards.length} awards totaling $${total} were marked paid in cash.`
  );
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

  function setQuotaReviewed(
    playerId: string,
    reviewed: boolean
  ) {
    setRoundBundle((current) => ({
      ...current,
      quotaUpdates: (current.quotaUpdates ?? []).map((update) =>
        update.playerId === playerId
          ? { ...update, reviewed }
          : update
      )
    }));
  }

  function markAllQuotasReviewed() {
    setRoundBundle((current) => ({
      ...current,
      quotaUpdates: (current.quotaUpdates ?? []).map((update) => ({
        ...update,
        reviewed: true
      }))
    }));
  }

  function overrideQuota(
    playerId: string,
    newQuota: number,
    reason?: string
  ) {
    const officialQuota = Math.max(12, newQuota);
    setRoundBundle((current) => ({
      ...current,
      quotaUpdates: (current.quotaUpdates ?? []).map((update) =>
        update.playerId === playerId
          ? {
              ...update,
              officialAdjustment: officialQuota - update.oldQuota,
              newQuota: officialQuota,
              overrideReason:
                officialQuota === update.oldQuota + update.calculatedAdjustment
                  ? undefined
                  : reason,
              reviewed: true
            }
          : update
      )
    }));
  }

  function finalizeTournament() {
    if (roundIsFinalized) return;

    const readiness = getFinalizeReadiness(roundBundle);
    if (!readiness.ready) {
      window.alert('The tournament cannot be finalized until every readiness item is complete.');
      return;
    }

    if (!window.confirm(`Finalize the ${roundBundle.round.date} tournament? This will lock Saturday operations and scoring.`)) {
      return;
    }

    const finalizedAt = new Date().toISOString();
    const finalizedVersion = '1.0.0-rc1';
    const officialQuotaUpdates = roundBundle.quotaUpdates ?? [];

    setPlayers((currentPlayers) =>
      currentPlayers.map((player) => {
        const update = officialQuotaUpdates.find(
          (candidate) => candidate.playerId === player.id
        );
        return update
          ? { ...player, quota: update.newQuota }
          : player;
      })
    );

    setRoundBundle((current) => {
      const quotaEvents = (current.quotaUpdates ?? [])
        .filter(
          (update) =>
            update.officialAdjustment !== 0 ||
            Boolean(update.overrideReason)
        )
        .map((update) => {
          const playerName =
            players.find((player) => player.id === update.playerId)?.name ??
            update.playerId;
          return createTournamentEvent(
            current.round.id,
            'quota-updated',
            `${playerName} quota updated from ${update.oldQuota} to ${update.newQuota}`,
            {
              playerIds: [update.playerId],
              note: update.overrideReason
                ? `Manual override: ${update.overrideReason}`
                : `Official change ${update.officialAdjustment > 0 ? '+' : ''}${update.officialAdjustment}`
            }
          );
        });

      return {
        ...current,
        round: {
          ...current.round,
          state: 'completed',
          finalizedAt,
          finalizedVersion
        },
        quotaUpdates: (current.quotaUpdates ?? []).map((update) => ({
          ...update,
          appliedAt: finalizedAt
        })),
        tournamentEvents: [
          ...(current.tournamentEvents ?? []),
          ...quotaEvents,
          createTournamentEvent(
            current.round.id,
            'finalized',
            `Tournament finalized with Bear Tracker ${finalizedVersion}`
          )
        ]
      };
    });

    setCurrentWorkspace('finalize');
  }

  async function attachScorecardPhoto(
    scorecardId: string,
    file: File
  ): Promise<void> {
    const imageUrl = await prepareScorecardPhoto(file);

    setRoundBundle((current) => ({
      ...current,
      scorecardImports: current.scorecardImports.map((scorecardImport) =>
        scorecardImport.scorecardId === scorecardId
          ? {
              ...scorecardImport,
              imageName: file.name,
              imageUrl
            }
          : scorecardImport
      )
    }));
  }


  async function recognizeScorecardIdentityWithAI(scorecardId: string): Promise<ScorecardIdentityReview> {
    const scorecard = roundBundle.scorecards.find((card) => card.id === scorecardId);
    const scorecardImport = roundBundle.scorecardImports.find((item) => item.scorecardId === scorecardId);
    if (!scorecard || !scorecardImport?.imageUrl) {
      throw new Error('Attach a paper scorecard photo before identifying it.');
    }

    const assignedPlayers = scorecard.players.map((scorecardPlayer) => ({
      playerId: scorecardPlayer.playerId,
      name: players.find((player) => player.id === scorecardPlayer.playerId)?.name ?? scorecardPlayer.playerId
    }));

    const result = await recognizeScorecardIdentity(
      scorecardImport.imageUrl,
      assignedPlayers.map((player) => player.name),
      scorecard.cardNumber,
      scorecard.teeTime
    );

    const normalizeTime = (value: string | null): string =>
      (value ?? '').toLowerCase().replace(/[^0-9apm]/g, '');

    return {
      ...result,
      expectedCardNumber: scorecard.cardNumber,
      expectedTeeTime: scorecard.teeTime,
      cardNumberMatches: result.cardNumber === null ? null : result.cardNumber === scorecard.cardNumber,
      teeTimeMatches: result.teeTime === null || !scorecard.teeTime
        ? null
        : normalizeTime(result.teeTime) === normalizeTime(scorecard.teeTime),
      matchedPlayers: result.playerNames.map((recognized) => {
        const match = matchRecognizedPlayerName(recognized.rawName, assignedPlayers);
        return {
          ...recognized,
          matchedPlayerId: match.matchedPlayerId,
          matchedPlayerName: match.matchedPlayerName,
          matchConfidence: match.confidence,
          matchMethod: match.method,
          alternatives: match.alternatives
        };
      })
    };
  }

  async function readScorecardWithAI(scorecardId: string): Promise<void> {
    const scorecard = roundBundle.scorecards.find((card) => card.id === scorecardId);
    const scorecardImport = roundBundle.scorecardImports.find((item) => item.scorecardId === scorecardId);
    if (!scorecard || !scorecardImport?.imageUrl) {
      throw new Error('Attach a paper scorecard photo before reading it.');
    }

    const assignedPlayers = scorecard.players.map((scorecardPlayer) => ({
      playerId: scorecardPlayer.playerId,
      name: players.find((player) => player.id === scorecardPlayer.playerId)?.name ?? scorecardPlayer.playerId
    }));

    setRoundBundle((current) => ({
      ...current,
      scorecardImports: current.scorecardImports.map((item) =>
        item.scorecardId === scorecardId ? { ...item, status: 'processing', issues: [] } : item
      )
    }));

    try {
      const result = await recognizeScorecard(
        scorecardImport.imageUrl,
        assignedPlayers.map((player) => player.name)
      );

      setRoundBundle((current) => ({
        ...current,
        scorecardImports: current.scorecardImports.map((item) => {
          if (item.scorecardId !== scorecardId) return item;

          const issues: ScorecardImportIssue[] = result.warnings.map((warning) => ({
            id: crypto.randomUUID(),
            type: 'other' as const,
            message: warning,
            resolved: false
          }));

          const cells = item.cells.map((cell) => {
            const playerIndex = assignedPlayers.findIndex((player) => player.playerId === cell.playerId);
            const recognizedPlayer = result.players[playerIndex];
            const recognizedScore = recognizedPlayer?.scores.find((score) => score.holeNumber === cell.holeNumber);
            const score = recognizedScore?.score ?? null;
            const numericConfidence = recognizedScore?.confidence ?? 0;
            const confidence: ScoreConfidence = score === null
              ? 'missing'
              : numericConfidence >= 0.9
                ? 'high'
                : numericConfidence >= 0.7
                  ? 'medium'
                  : 'low';
            const requiresReview = score === null || confidence !== 'high';

            if (requiresReview) {
              issues.push({
                id: crypto.randomUUID(),
                type: score === null ? 'unreadable-score' as const : 'other' as const,
                message: recognizedScore?.reviewReason || `${assignedPlayers[playerIndex]?.name ?? cell.playerId}, hole ${cell.holeNumber} needs review.`,
                playerId: cell.playerId,
                holeNumber: cell.holeNumber,
                resolved: false
              });
            }

            return {
              ...cell,
              extractedScore: score,
              confirmedScore: confidence === 'high' ? score : null,
              confidence,
              requiresReview,
              reviewReason: requiresReview ? (recognizedScore?.reviewReason || 'AI confidence is below the automatic-confirmation threshold.') : undefined
            };
          });

          return {
            ...item,
            status: 'needs-review' as const,
            extractedAt: new Date().toISOString(),
            cells,
            issues,
            notes: `Read by ${result.provider} using ${result.model}.`
          };
        })
      }));
    } catch (error) {
      setRoundBundle((current) => ({
        ...current,
        scorecardImports: current.scorecardImports.map((item) =>
          item.scorecardId === scorecardId ? { ...item, status: 'import-failed' } : item
        )
      }));
      throw error;
    }
  }

  function beginScorecardReview(scorecardId: string) {
    setRoundBundle((current) => ({
      ...current,
      scorecardImports: current.scorecardImports.map((scorecardImport) =>
        scorecardImport.scorecardId === scorecardId
          ? {
              ...scorecardImport,
              status: 'needs-review',
              extractedAt: scorecardImport.extractedAt ?? new Date().toISOString()
            }
          : scorecardImport
      )
    }));
  }

  function changeScorecardImportCell(
    scorecardId: string,
    playerId: string,
    holeNumber: number,
    score: number | null,
    confidence: ScoreConfidence
  ) {
    setRoundBundle((current) => ({
      ...current,
      scorecardImports: current.scorecardImports.map((scorecardImport) => {
        if (scorecardImport.scorecardId !== scorecardId) return scorecardImport;

        const cells = scorecardImport.cells.map((cell) =>
          cell.playerId === playerId && cell.holeNumber === holeNumber
            ? {
                ...cell,
                extractedScore: score,
                confirmedScore: score,
                confidence,
                requiresReview: score === null,
                reviewReason: score === null ? 'No score has been confirmed.' : undefined
              }
            : cell
        );

        return {
          ...scorecardImport,
          status: 'needs-review',
          cells,
          issues: scorecardImport.issues.map((issue) =>
            issue.playerId === playerId && issue.holeNumber === holeNumber
              ? { ...issue, resolved: score !== null }
              : issue
          )
        };
      })
    }));
  }

  function importConfirmedScorecardScores(scorecardId: string) {
    setRoundBundle((current) => {
      const scorecardImport = current.scorecardImports.find(
        (item) => item.scorecardId === scorecardId
      );
      const scorecardEntry = current.scorecardEntries.find(
        (entry) => entry.scorecardId === scorecardId
      );

      if (!scorecardImport || !scorecardEntry) return current;
      if (scorecardImport.cells.some((cell) => cell.confirmedScore === null)) {
        window.alert('Every hole score must be confirmed before importing.');
        return current;
      }

      try {
        const updatedEntry = scorecardImport.cells.reduce(
          (entry, cell) => updateGrossScore(
            entry,
            cell.playerId,
            cell.holeNumber,
            cell.confirmedScore,
            blackBearCourse,
            bearTrackerScoringSettings
          ),
          scorecardEntry
        );

        const completedAt = new Date().toISOString();
        return {
          ...current,
          scorecardEntries: current.scorecardEntries.map((entry) =>
            entry.scorecardId === scorecardId ? updatedEntry : entry
          ),
          scorecardImports: current.scorecardImports.map((item) =>
            item.scorecardId === scorecardId
              ? {
                  ...item,
                  status: 'complete',
                  verifiedAt: completedAt,
                  completedAt,
                  issues: item.issues.map((issue) => ({ ...issue, resolved: true }))
                }
              : item
          )
        };
      } catch (error) {
        window.alert(error instanceof Error ? error.message : 'The confirmed scores could not be imported.');
        return current;
      }
    });
  }
  function removeScorecardPhoto(scorecardId: string) {
    setRoundBundle((current) => ({
      ...current,
      scorecardImports: current.scorecardImports.map((scorecardImport) =>
        scorecardImport.scorecardId === scorecardId
          ? {
              ...scorecardImport,
              imageName: undefined,
              imageUrl: undefined
            }
          : scorecardImport
      )
    }));
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
        onChangeWorkspace={(workspace) =>
          navigateToWorkspace(workspace)
        }
      />

      {currentWorkspace === 'home' && (
        <HomeWorkspace
          roundDate={roundBundle.round.date}
          mission={missionControl}
          recentEvents={recentTournamentEvents}
          onNavigate={(workspace, section) =>
            navigateToWorkspace(workspace, section)
          }
        />
      )}

      {currentWorkspace === 'operations' && roundIsFinalized && (
        <section className="card"><h2>🔒 Tournament Finalized</h2><p>Saturday operations are locked. Use Results, Treasurer history, or Finalize to review the completed round.</p></section>
      )}

      {currentWorkspace ===
        'operations' && !roundIsFinalized && (
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
          onCompletePlayerStatusReview={
            completePlayerStatusReview
          }
          onCompleteCardOrderReview={
            completeCardOrderReview
          }
          getAvailableCredit={
            getAvailableCredit
          }
          onCompleteArrival={
            completeArrival
          }
          onAddTournamentNote={
            addTournamentNote
          }
          navigationSection={navigationSection}
          onNavigationHandled={clearNavigationSection}
        />
      )}

      {currentWorkspace === 'tournament' && roundIsFinalized && (
        <section className="card"><h2>🔒 Tournament Finalized</h2><p>Score entry is locked for this completed round.</p></section>
      )}

      {currentWorkspace ===
        'tournament' && !roundIsFinalized && (
        <TournamentWorkspace
          scorecards={
            roundBundle.scorecards
          }
          scorecardEntries={
            roundBundle.scorecardEntries
          }
          scorecardImports={
            roundBundle.scorecardImports
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
          onAttachScorecardPhoto={attachScorecardPhoto}
          onRemoveScorecardPhoto={removeScorecardPhoto}
          onBeginScorecardReview={beginScorecardReview}
          onRecognizeScorecardIdentity={recognizeScorecardIdentityWithAI}
          onReadScorecard={readScorecardWithAI}
          onChangeScorecardImportCell={changeScorecardImportCell}
          onImportConfirmedScores={importConfirmedScorecardScores}
          navigationSection={navigationSection}
          onNavigationHandled={clearNavigationSection}
        />
      )}

      {currentWorkspace ===
        'results' && (
        <ResultsWorkspace
          roundDate={roundBundle.round.date}
          players={players}
          roundPlayers={roundBundle.roundPlayers}
          scorecards={roundBundle.scorecards}
          scorecardEntries={roundBundle.scorecardEntries}
          resultsSettings={roundBundle.resultsSettings}
          onUpdateResultsSettings={roundIsFinalized ? () => window.alert('This tournament is finalized and results are locked.') : updateResultsSettings}
          navigationSection={navigationSection}
          onNavigationHandled={clearNavigationSection}
        />
      )}

      {currentWorkspace ===
        'finance' && (
        <TreasurerWorkspace
          players={players}
          roundPlayers={roundBundle.roundPlayers}
          awardEntries={buildAwardEntries(
            roundBundle.round.id,
            roundBundle.roundPlayers,
            roundBundle.scorecardEntries,
            roundBundle.resultsSettings,
            roundBundle.awardEntries ?? []
          )}
          treasuryTransactions={roundBundle.treasuryTransactions ?? []}
          playerAccounts={playerAccounts}
          treasuryReconciliation={roundBundle.treasuryReconciliation}
          onUpdateTreasuryReconciliation={roundIsFinalized ? () => window.alert('This tournament is finalized and treasury is locked.') : updateTreasuryReconciliation}
          onSettleAward={roundIsFinalized ? () => window.alert('This tournament is finalized and treasury is locked.') : settleAward}
          onSettleCategoryCash={roundIsFinalized ? () => window.alert('This tournament is finalized and treasury is locked.') : settleCategoryCash}
          navigationSection={navigationSection}
          onNavigationHandled={clearNavigationSection}
        />
      )}


      {currentWorkspace === 'quotas' && (
        <QuotaWorkspace
          players={players}
          quotaUpdates={roundBundle.quotaUpdates ?? []}
          finalized={roundIsFinalized}
          onSetReviewed={setQuotaReviewed}
          onMarkAllReviewed={markAllQuotasReviewed}
          onOverride={overrideQuota}
        />
      )}


      {currentWorkspace === 'finalize' && (
        <FinalizeWorkspace
          bundle={roundBundle}
          readiness={finalizeReadiness}
          onGoToWorkspace={setCurrentWorkspace}
          onFinalize={finalizeTournament}
        />
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
          <AIRecognitionSettings />
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