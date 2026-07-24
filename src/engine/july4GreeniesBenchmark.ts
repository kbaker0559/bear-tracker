import type { Player } from '../types';
import type { GreeniesResult } from './greeniesEngine';

export type July4GreeniesValidation = {
  applies: boolean;
  passed: boolean;
  messages: string[];
};

const EXPECTED_WINNERS: Record<number, string> = {
  3: 'Anthony Ciuzio',
  5: 'Anthony Ciuzio',
  11: 'Ed Sanchez',
  15: 'Wayne Smith'
};

export function validateJuly4Greenies(
  roundDate: string,
  result: GreeniesResult,
  players: Player[]
): July4GreeniesValidation {
  if (roundDate !== '2026-07-04') {
    return {
      applies: false,
      passed: false,
      messages: []
    };
  }

  const messages: string[] = [];

  for (const [holeText, expectedName] of Object.entries(EXPECTED_WINNERS)) {
    const holeNumber = Number(holeText);
    const hole = result.holes.find(
      (candidate) => candidate.holeNumber === holeNumber
    );
    const actualName = hole?.winnerId
      ? players.find((player) => player.id === hole.winnerId)?.name ?? hole.winnerId
      : 'No Winner';

    if (actualName !== expectedName) {
      messages.push(
        `Hole ${holeNumber}: expected ${expectedName}, found ${actualName}.`
      );
    }

    if (hole?.calculatedAward !== 23) {
      messages.push(
        `Hole ${holeNumber}: expected a calculated payout of $23, found $${hole?.calculatedAward ?? 0}.`
      );
    }
  }

  if (result.greeniesPot !== 92) {
    messages.push(
      `Expected a $92 Greenies pot, found $${result.greeniesPot}.`
    );
  }

  return {
    applies: true,
    passed: result.ready && messages.length === 0,
    messages
  };
}
