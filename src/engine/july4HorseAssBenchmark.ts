import type { Player } from '../types';
import type { HorseAssResult } from './horseAssEngine';

export type July4HorseAssBenchmarkResult = {
  applies: boolean;
  passed: boolean;
  messages: string[];
};

export function validateJuly4HorseAss(
  roundDate: string,
  result: HorseAssResult,
  players: Player[]
): July4HorseAssBenchmarkResult {
  if (roundDate !== '2026-07-04') {
    return { applies: false, passed: false, messages: [] };
  }

  const messages: string[] = [];
  const winnerNames = result.winners
    .map(
      (winner) =>
        players.find((player) => player.id === winner.playerId)?.name ??
        winner.playerId
    )
    .sort();

  if (result.eligiblePlayerCount !== 23) {
    messages.push(
      `Expected 23 eligible completed golfers; found ${result.eligiblePlayerCount}.`
    );
  }

  if (winnerNames.length !== 1 || winnerNames[0] !== 'Gary Pardue') {
    messages.push(
      `Expected Gary Pardue as the Horse's Ass winner; found ${winnerNames.join(', ') || 'no winner'}.`
    );
  }

  if (result.lowestQuotaResult !== -7) {
    messages.push(
      `Expected the lowest quota result to be -7; found ${result.lowestQuotaResult ?? 'none'}.`
    );
  }

  if (result.pot !== 10 || result.calculatedPayoutEach !== 10) {
    messages.push(
      `Expected a $10 pot and $10 calculated payout; found $${result.pot} and $${result.calculatedPayoutEach}.`
    );
  }

  return {
    applies: true,
    passed: messages.length === 0,
    messages
  };
}
