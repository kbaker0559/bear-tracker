import type { Player } from '../types';
import type { SkinsResult } from './skinsEngine';

export type July4SkinsBenchmarkResult = {
  applies: boolean;
  passed: boolean;
  messages: string[];
};

const expectedWinners: Array<[number, string]> = [
  [1, 'George Heider'],
  [9, 'Anthony Ciuzio'],
  [11, 'Ed Sanchez'],
  [14, 'Shawn Boone'],
  [15, 'Les Smith'],
  [16, 'Tyler Adams']
];

export function validateJuly4Skins(
  roundDate: string,
  skins: SkinsResult,
  players: Player[]
): July4SkinsBenchmarkResult {
  if (roundDate !== '2026-07-04') {
    return {
      applies: false,
      passed: false,
      messages: []
    };
  }

  const messages: string[] = [];
  const playerName = (playerId: string | null): string =>
    players.find((player) => player.id === playerId)?.name ?? playerId ?? 'No winner';

  if (skins.skinsPot !== 115) {
    messages.push(`Expected a $115 skins pot, calculated $${skins.skinsPot}.`);
  }

  if (skins.winningSkins.length !== expectedWinners.length) {
    messages.push(
      `Expected ${expectedWinners.length} skins, calculated ${skins.winningSkins.length}.`
    );
  }

  for (const [holeNumber, expectedName] of expectedWinners) {
    const hole = skins.winningSkins.find(
      (candidate) => candidate.holeNumber === holeNumber
    );
    const actualName = playerName(hole?.winnerId ?? null);

    if (!hole || actualName !== expectedName) {
      messages.push(
        `Hole ${holeNumber}: expected ${expectedName}, calculated ${actualName}.`
      );
    }
  }

  if (skins.calculatedPayoutPerSkin !== 19) {
    messages.push(
      `Expected calculated skins payout of $19, calculated $${skins.calculatedPayoutPerSkin}.`
    );
  }

  return {
    applies: true,
    passed: messages.length === 0,
    messages
  };
}
