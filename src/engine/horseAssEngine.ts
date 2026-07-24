import type { RoundPlayer } from '../types/roundPlayer';
import type { ScorecardEntry } from '../types/scoreEntry';
import { getPayoutLookup } from '../data/payoutLookup';

export type HorseAssWinner = {
  playerId: string;
  quotaResult: number;
  calculatedPayout: number;
  officialPayout: number;
};

export type HorseAssResult = {
  eligiblePlayerCount: number;
  pot: number;
  lowestQuotaResult: number | null;
  winners: HorseAssWinner[];
  calculatedPayoutEach: number;
  calculatedDistributed: number;
  calculatedRemainder: number;
  officialPayoutEach: number;
  officialDistributed: number;
  officialDifference: number;
  ready: boolean;
};

function isInactiveStatus(status: RoundPlayer['status']): boolean {
  return (
    status === 'dns' ||
    status === 'no-show' ||
    status === 'withdrawn' ||
    status === 'removed'
  );
}

function playerCompletedAllHoles(
  scorecardEntry: ScorecardEntry,
  playerId: string
): boolean {
  const playerEntry = scorecardEntry.players.find(
    (candidate) => candidate.playerId === playerId
  );

  return (
    playerEntry !== undefined &&
    playerEntry.scores.length === 18 &&
    playerEntry.scores.every((score) => score.grossScore !== null) &&
    playerEntry.quotaResult !== null
  );
}

export function calculateHorseAss(
  roundPlayers: RoundPlayer[],
  scorecardEntries: ScorecardEntry[],
  officialPayoutOverride?: number
): HorseAssResult {
  const completedEntries = scorecardEntries.filter(
    (entry) => entry.status === 'complete' || entry.status === 'verified'
  );

  const quotaResultByPlayer = new Map<string, number>();

  for (const entry of completedEntries) {
    for (const playerEntry of entry.players) {
      if (
        playerCompletedAllHoles(entry, playerEntry.playerId) &&
        playerEntry.quotaResult !== null
      ) {
        quotaResultByPlayer.set(playerEntry.playerId, playerEntry.quotaResult);
      }
    }
  }

  const eligiblePlayers = roundPlayers.filter((roundPlayer) =>
    roundPlayer.isEligibleForHorseAss &&
    !isInactiveStatus(roundPlayer.status) &&
    quotaResultByPlayer.has(roundPlayer.playerId)
  );

  const eligiblePlayerCount = eligiblePlayers.length;
  const pot =
    eligiblePlayerCount >= 4 && eligiblePlayerCount <= 40
      ? getPayoutLookup(eligiblePlayerCount).horseAss
      : 0;

  if (eligiblePlayers.length === 0 || pot === 0) {
    return {
      eligiblePlayerCount,
      pot,
      lowestQuotaResult: null,
      winners: [],
      calculatedPayoutEach: 0,
      calculatedDistributed: 0,
      calculatedRemainder: pot,
      officialPayoutEach: 0,
      officialDistributed: 0,
      officialDifference: pot,
      ready: false
    };
  }

  const lowestQuotaResult = Math.min(
    ...eligiblePlayers.map(
      (player) => quotaResultByPlayer.get(player.playerId) as number
    )
  );

  const winnerIds = eligiblePlayers
    .filter(
      (player) => quotaResultByPlayer.get(player.playerId) === lowestQuotaResult
    )
    .map((player) => player.playerId);

  const calculatedPayoutEach = Math.floor(pot / winnerIds.length);
  const officialPayoutEach = Math.max(
    0,
    Math.floor(officialPayoutOverride ?? calculatedPayoutEach)
  );
  const calculatedDistributed = calculatedPayoutEach * winnerIds.length;
  const officialDistributed = officialPayoutEach * winnerIds.length;

  return {
    eligiblePlayerCount,
    pot,
    lowestQuotaResult,
    winners: winnerIds.map((playerId) => ({
      playerId,
      quotaResult: lowestQuotaResult,
      calculatedPayout: calculatedPayoutEach,
      officialPayout: officialPayoutEach
    })),
    calculatedPayoutEach,
    calculatedDistributed,
    calculatedRemainder: pot - calculatedDistributed,
    officialPayoutEach,
    officialDistributed,
    officialDifference: pot - officialDistributed,
    ready: true
  };
}
