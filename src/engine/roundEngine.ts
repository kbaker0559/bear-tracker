import type { CurrentRound } from '../types/currentRound';
import type { RoundPlayer } from '../types/roundPlayer';
import type { Scorecard } from '../types/scorecard';

export type RoundBundle = {
  round: CurrentRound;
  roundPlayers: RoundPlayer[];
  scorecards: Scorecard[];
};

export function createEmptyRound(date: string): RoundBundle {
  const roundId = `round-${date}`;

  return {
    round: {
      id: roundId,
      date,
      state: 'planning',
      expectedPlayerCount: 0,
      checkedInCount: 0,
      paidCount: 0,
      scorecardCount: 0
    },
    roundPlayers: [],
    scorecards: []
  };
}

export function createRoundFromScorecards(
  date: string,
  scorecards: Scorecard[]
): RoundBundle {
  const roundId = `round-${date}`;

  const normalizedScorecards = scorecards.map((card) => ({
    ...card,
    roundId
  }));

  const roundPlayers: RoundPlayer[] = normalizedScorecards.flatMap((card) =>
    card.players.map((cardPlayer) => ({
      roundId,
      playerId: cardPlayer.playerId,
      status: 'expected',
      checkedIn: false,
      paid: false,
      scorecardId: card.id,
      scorekeeperForScorecardId:
        card.scorekeeperId === cardPlayer.playerId ? card.id : undefined,
      isEligibleForPlaces: true,
      isEligibleForSkins: true,
      isEligibleForGreenies: true,
      isEligibleForHorseAss: true,
      amountPaid: 0,
      amountWon: 0,
      amountOwed: 0
    }))
  );

  return {
    round: {
      id: roundId,
      date,
      state: 'pairings-ready',
      expectedPlayerCount: roundPlayers.length,
      checkedInCount: 0,
      paidCount: 0,
      scorecardCount: normalizedScorecards.length
    },
    roundPlayers,
    scorecards: normalizedScorecards
  };
}

export function refreshRoundCounts(bundle: RoundBundle): RoundBundle {
  return {
    ...bundle,
    round: {
      ...bundle.round,
      expectedPlayerCount: bundle.roundPlayers.length,
      checkedInCount: bundle.roundPlayers.filter((player) => player.checkedIn).length,
      paidCount: bundle.roundPlayers.filter((player) => player.paid).length,
      scorecardCount: bundle.scorecards.length
    }
  };
}