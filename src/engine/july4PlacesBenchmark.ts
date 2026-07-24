import type { Player } from '../types';
import type { PlacesResult } from './placesEngine';

export type PlacesBenchmarkCheck = {
  applies: boolean;
  passed: boolean;
  messages: string[];
};

const EXPECTED = [
  { name: 'Anthony Ciuzio', place: 'T1', quotaResult: 7, payout: 92 },
  { name: 'Neal Self', place: 'T1', quotaResult: 7, payout: 92 },
  { name: 'Bruce Coleman', place: '3', quotaResult: 6, payout: 70 },
  { name: 'Steve Robin', place: 'T4', quotaResult: 5, payout: 40 },
  { name: 'Tyler Adams', place: 'T4', quotaResult: 5, payout: 40 }
];

export function validateJuly4Places(
  roundDate: string,
  places: PlacesResult,
  players: Player[]
): PlacesBenchmarkCheck {
  if (roundDate !== '2026-07-04') {
    return {
      applies: false,
      passed: false,
      messages: []
    };
  }

  const playerName = (playerId: string) =>
    players.find((player) => player.id === playerId)?.name ?? playerId;

  const paidStandings = places.standings
    .filter((standing) => standing.inMoney)
    .map((standing) => ({
      name: playerName(standing.playerId),
      place: standing.displayPlace,
      quotaResult: standing.quotaResult,
      payout: standing.payout
    }))
    .sort((first, second) => first.name.localeCompare(second.name));

  const expected = [...EXPECTED].sort((first, second) =>
    first.name.localeCompare(second.name)
  );

  const messages: string[] = [];

  if (places.playerCount !== 23) {
    messages.push(`Expected 23 eligible players; found ${places.playerCount}.`);
  }

  if (places.placesPot !== 335) {
    messages.push(`Expected a $335 places pot; found $${places.placesPot}.`);
  }

  if (places.distributed !== 334) {
    messages.push(`Expected $334 distributed; found $${places.distributed}.`);
  }

  if (places.roundingRemainder !== 1) {
    messages.push(
      `Expected a $1 rounding remainder; found $${places.roundingRemainder}.`
    );
  }

  if (paidStandings.length !== expected.length) {
    messages.push(
      `Expected ${expected.length} paid golfers; found ${paidStandings.length}.`
    );
  }

  for (const expectedStanding of expected) {
    const actual = paidStandings.find(
      (standing) => standing.name === expectedStanding.name
    );

    if (!actual) {
      messages.push(`${expectedStanding.name} is missing from the paid places.`);
      continue;
    }

    if (
      actual.place !== expectedStanding.place ||
      actual.quotaResult !== expectedStanding.quotaResult ||
      actual.payout !== expectedStanding.payout
    ) {
      messages.push(
        `${expectedStanding.name}: expected ${expectedStanding.place}, ` +
          `${expectedStanding.quotaResult >= 0 ? '+' : ''}${expectedStanding.quotaResult}, ` +
          `$${expectedStanding.payout}; found ${actual.place}, ` +
          `${actual.quotaResult >= 0 ? '+' : ''}${actual.quotaResult}, $${actual.payout}.`
      );
    }
  }

  return {
    applies: true,
    passed: messages.length === 0,
    messages
  };
}
