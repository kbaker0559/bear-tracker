import type { Player } from '../types';

export type PlayerMatchStatus =
  | 'exact'
  | 'alias'
  | 'suggested'
  | 'unmatched';

export type PlayerMatch = {
  importedName: string;
  status: PlayerMatchStatus;
  playerId: string | null;
  matchedName: string | null;
};

const playerAliases: Record<string, string> = {
  garypurdue: 'garypardue'
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function editDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const columns = b.length + 1;

  const matrix = Array.from({ length: rows }, () =>
    Array<number>(columns).fill(0)
  );

  for (let row = 0; row < rows; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column < columns; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row < rows; row += 1) {
    for (let column = 1; column < columns; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;

      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
}

export function matchPlayer(
  importedName: string,
  players: Player[]
): PlayerMatch {
  const normalizedImportedName = normalizeName(importedName);

  const exactMatch = players.find(
    (player) => normalizeName(player.name) === normalizedImportedName
  );

  if (exactMatch) {
    return {
      importedName,
      status: 'exact',
      playerId: exactMatch.id,
      matchedName: exactMatch.name
    };
  }

  const aliasTarget = playerAliases[normalizedImportedName];

  if (aliasTarget) {
    const aliasMatch = players.find(
      (player) => normalizeName(player.name) === aliasTarget
    );

    if (aliasMatch) {
      return {
        importedName,
        status: 'alias',
        playerId: aliasMatch.id,
        matchedName: aliasMatch.name
      };
    }
  }

  const candidates = players
    .map((player) => ({
      player,
      distance: editDistance(
        normalizedImportedName,
        normalizeName(player.name)
      )
    }))
    .sort((a, b) => a.distance - b.distance);

  const bestCandidate = candidates[0];

  if (bestCandidate && bestCandidate.distance <= 2) {
    return {
      importedName,
      status: 'suggested',
      playerId: bestCandidate.player.id,
      matchedName: bestCandidate.player.name
    };
  }

  return {
    importedName,
    status: 'unmatched',
    playerId: null,
    matchedName: null
  };
}