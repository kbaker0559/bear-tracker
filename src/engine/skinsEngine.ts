import type { RoundPlayer } from '../types/roundPlayer';
import type { ScorecardEntry } from '../types/scoreEntry';
import { getPayoutLookup } from '../data/payoutLookup';
import { getBlackBearHole } from '../data/blackBearCourse';

export type SkinHolePlayerDetail = {
  playerId: string;
  courseHandicap: number;
  grossScore: number;
  handicapStrokes: number;
  netScore: number;
};

export type SkinHoleResult = {
  holeNumber: number;
  strokeIndex: number;
  status: 'skin' | 'tie' | 'pending';
  winningNetScore: number | null;
  winnerId: string | null;
  tiedPlayerIds: string[];
  players: SkinHolePlayerDetail[];
};

export type SkinsResult = {
  playerCount: number;
  skinsPot: number;
  holesEvaluated: number;
  winningSkins: SkinHoleResult[];
  allHoles: SkinHoleResult[];
  calculatedPayoutPerSkin: number;
  officialPayoutPerSkin: number;
  calculatedDistributed: number;
  officialDistributed: number;
  calculatedRemainder: number;
  officialDifference: number;
};

function isInactiveStatus(status: RoundPlayer['status']): boolean {
  return (
    status === 'dns' ||
    status === 'no-show' ||
    status === 'withdrawn' ||
    status === 'removed'
  );
}

export function calculateSkins(
  roundPlayers: RoundPlayer[],
  scorecardEntries: ScorecardEntry[],
  officialPayoutOverride?: number
): SkinsResult {
  const eligibleIds = new Set(
    roundPlayers
      .filter(
        (player) =>
          player.isEligibleForSkins &&
          !isInactiveStatus(player.status)
      )
      .map((player) => player.playerId)
  );

  const playerEntries = scorecardEntries
    .flatMap((entry) => entry.players)
    .filter((entry) => eligibleIds.has(entry.playerId));

  const allHoles: SkinHoleResult[] = [];

  for (let holeNumber = 1; holeNumber <= 18; holeNumber += 1) {
    const hole = getBlackBearHole(holeNumber);
    const players: SkinHolePlayerDetail[] = [];
    let complete = playerEntries.length > 0;

    for (const entry of playerEntries) {
      const score = entry.scores.find(
        (candidate) => candidate.holeNumber === holeNumber
      );

      if (
        !score ||
        score.grossScore === null ||
        score.handicapStrokes === null ||
        score.netScore === null
      ) {
        complete = false;
        continue;
      }

      players.push({
        playerId: entry.playerId,
        courseHandicap: entry.courseHandicap,
        grossScore: score.grossScore,
        handicapStrokes: score.handicapStrokes,
        netScore: score.netScore
      });
    }

    players.sort((first, second) => {
      if (first.netScore !== second.netScore) {
        return first.netScore - second.netScore;
      }

      if (first.grossScore !== second.grossScore) {
        return first.grossScore - second.grossScore;
      }

      return first.playerId.localeCompare(second.playerId);
    });

    if (!complete || players.length !== playerEntries.length) {
      allHoles.push({
        holeNumber,
        strokeIndex: hole.strokeIndex,
        status: 'pending',
        winningNetScore: null,
        winnerId: null,
        tiedPlayerIds: [],
        players
      });
      continue;
    }

    const lowNet = Math.min(...players.map((player) => player.netScore));
    const lowPlayers = players.filter((player) => player.netScore === lowNet);

    allHoles.push({
      holeNumber,
      strokeIndex: hole.strokeIndex,
      status: lowPlayers.length === 1 ? 'skin' : 'tie',
      winningNetScore: lowNet,
      winnerId: lowPlayers.length === 1 ? lowPlayers[0].playerId : null,
      tiedPlayerIds: lowPlayers.map((player) => player.playerId),
      players
    });
  }

  const winningSkins = allHoles.filter((hole) => hole.status === 'skin');
  const playerCount = eligibleIds.size;
  const skinsPot =
    playerCount >= 4 && playerCount <= 40
      ? getPayoutLookup(playerCount).skins
      : 0;
  const calculatedPayoutPerSkin =
    winningSkins.length > 0
      ? Math.floor(skinsPot / winningSkins.length)
      : 0;
  const officialPayoutPerSkin =
    officialPayoutOverride !== undefined
      ? Math.max(0, Math.floor(officialPayoutOverride))
      : calculatedPayoutPerSkin;
  const calculatedDistributed =
    calculatedPayoutPerSkin * winningSkins.length;
  const officialDistributed =
    officialPayoutPerSkin * winningSkins.length;

  return {
    playerCount,
    skinsPot,
    holesEvaluated: allHoles.filter((hole) => hole.status !== 'pending').length,
    winningSkins,
    allHoles,
    calculatedPayoutPerSkin,
    officialPayoutPerSkin,
    calculatedDistributed,
    officialDistributed,
    calculatedRemainder: skinsPot - calculatedDistributed,
    officialDifference: skinsPot - officialDistributed
  };
}
