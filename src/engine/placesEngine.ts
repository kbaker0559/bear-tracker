import type { RoundPlayer } from '../types/roundPlayer';
import type { ScorecardEntry } from '../types/scoreEntry';
import { getPayoutLookup } from '../data/payoutLookup';

export type PlaceStanding = {
  playerId: string;
  quotaResult: number;
  stablefordPoints: number;
  grossTotal: number;
  placeStart: number;
  placeEnd: number;
  displayPlace: string;
  tied: boolean;
  payout: number;
  inMoney: boolean;
};

export type PlaceTieGroup = {
  quotaResult: number;
  placeStart: number;
  placeEnd: number;
  playerIds: string[];
  prizePool: number;
  payoutEach: number;
  distributed: number;
};

export type PlacesResult = {
  playerCount: number;
  placesPaid: number;
  placesPot: number;
  distributed: number;
  roundingRemainder: number;
  standings: PlaceStanding[];
  tieGroups: PlaceTieGroup[];
};

type RankedPlayer = {
  playerId: string;
  quotaResult: number;
  stablefordPoints: number;
  grossTotal: number;
};

function isInactiveStatus(status: RoundPlayer['status']): boolean {
  return (
    status === 'dns' ||
    status === 'no-show' ||
    status === 'withdrawn' ||
    status === 'removed'
  );
}

function getEligiblePlayers(
  roundPlayers: RoundPlayer[],
  scorecardEntries: ScorecardEntry[]
): RankedPlayer[] {
  const roundPlayerById = new Map(
    roundPlayers.map((player) => [player.playerId, player])
  );

  return scorecardEntries
    .flatMap((entry) => entry.players)
    .filter((entry) => {
      const roundPlayer = roundPlayerById.get(entry.playerId);

      return (
        roundPlayer !== undefined &&
        roundPlayer.isEligibleForPlaces &&
        !isInactiveStatus(roundPlayer.status) &&
        entry.quotaResult !== null &&
        entry.stablefordPoints !== null &&
        entry.grossTotal !== null
      );
    })
    .map((entry) => ({
      playerId: entry.playerId,
      quotaResult: entry.quotaResult as number,
      stablefordPoints: entry.stablefordPoints as number,
      grossTotal: entry.grossTotal as number
    }))
    .sort((first, second) => {
      if (first.quotaResult !== second.quotaResult) {
        return second.quotaResult - first.quotaResult;
      }

      if (first.stablefordPoints !== second.stablefordPoints) {
        return second.stablefordPoints - first.stablefordPoints;
      }

      if (first.grossTotal !== second.grossTotal) {
        return first.grossTotal - second.grossTotal;
      }

      return first.playerId.localeCompare(second.playerId);
    });
}

function displayPlace(placeStart: number, tied: boolean): string {
  return tied ? `T${placeStart}` : String(placeStart);
}

export function calculatePlaces(
  roundPlayers: RoundPlayer[],
  scorecardEntries: ScorecardEntry[]
): PlacesResult {
  const rankedPlayers = getEligiblePlayers(
    roundPlayers,
    scorecardEntries
  );

  if (rankedPlayers.length < 4 || rankedPlayers.length > 40) {
    return {
      playerCount: rankedPlayers.length,
      placesPaid: 0,
      placesPot: 0,
      distributed: 0,
      roundingRemainder: 0,
      standings: rankedPlayers.map((player, index) => ({
        ...player,
        placeStart: index + 1,
        placeEnd: index + 1,
        displayPlace: String(index + 1),
        tied: false,
        payout: 0,
        inMoney: false
      })),
      tieGroups: []
    };
  }

  const payoutRow = getPayoutLookup(rankedPlayers.length);
  const placeMoney = payoutRow.places;
  const tieGroups: PlaceTieGroup[] = [];
  const standings: PlaceStanding[] = [];

  let index = 0;
  let placeStart = 1;

  while (index < rankedPlayers.length) {
    const quotaResult = rankedPlayers[index].quotaResult;
    const groupPlayers: RankedPlayer[] = [];

    while (
      index < rankedPlayers.length &&
      rankedPlayers[index].quotaResult === quotaResult
    ) {
      groupPlayers.push(rankedPlayers[index]);
      index += 1;
    }

    const placeEnd = placeStart + groupPlayers.length - 1;
    const prizePool = Array.from(
      { length: groupPlayers.length },
      (_, offset) => placeStart + offset
    ).reduce(
      (total, occupiedPlace) =>
        total + (placeMoney[occupiedPlace - 1] ?? 0),
      0
    );
    const payoutEach =
      prizePool > 0
        ? Math.floor(prizePool / groupPlayers.length)
        : 0;
    const distributed = payoutEach * groupPlayers.length;
    const tied = groupPlayers.length > 1;

    tieGroups.push({
      quotaResult,
      placeStart,
      placeEnd,
      playerIds: groupPlayers.map((player) => player.playerId),
      prizePool,
      payoutEach,
      distributed
    });

    for (const player of groupPlayers) {
      standings.push({
        ...player,
        placeStart,
        placeEnd,
        displayPlace: displayPlace(placeStart, tied),
        tied,
        payout: payoutEach,
        inMoney: payoutEach > 0
      });
    }

    placeStart = placeEnd + 1;
  }

  const distributed = standings.reduce(
    (total, standing) => total + standing.payout,
    0
  );

  return {
    playerCount: rankedPlayers.length,
    placesPaid: placeMoney.length,
    placesPot: payoutRow.placesTotal,
    distributed,
    roundingRemainder: payoutRow.placesTotal - distributed,
    standings,
    tieGroups
  };
}
