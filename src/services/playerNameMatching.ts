export type PlayerNameCandidate = {
  playerId: string;
  name: string;
};

export type PlayerNameMatch = {
  rawName: string;
  matchedPlayerId: string | null;
  matchedPlayerName: string | null;
  confidence: number;
  method: 'exact' | 'alias' | 'fuzzy' | 'ambiguous' | 'unmatched';
  alternatives: string[];
};

const DEFAULT_ALIASES: Record<string, string[]> = {
  'mark knuuttila': ['knute', 'knut', 'knuut', 'mark'],
  'paul tucker sr': ['paul', 'paul sr', 'paul senior', 'p tucker sr'],
  'paul tucker jr': ['paul jr', 'paul junior', 'pj', 'p tucker jr'],
  'tony caisse': ['tony'],
  'anthony ciuzio': ['anthony'],
  'mike ondrasik': ['mike o', 'mike o.', 'ondrasik']
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b(senior)\b/g, 'sr')
    .replace(/\b(junior)\b/g, 'jr')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshtein(first: string, second: string): number {
  const rows = first.length + 1;
  const cols = second.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      const cost = first[row - 1] === second[col - 1] ? 0 : 1;
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + cost
      );
    }
  }
  return matrix[first.length][second.length];
}

function similarity(first: string, second: string): number {
  const maxLength = Math.max(first.length, second.length);
  if (maxLength === 0) return 1;
  return 1 - levenshtein(first, second) / maxLength;
}

function aliasesFor(playerName: string): string[] {
  const normalizedName = normalize(playerName);
  const direct = DEFAULT_ALIASES[normalizedName] ?? [];
  const firstName = normalizedName.split(' ')[0] ?? '';
  return [...direct, firstName].map(normalize).filter(Boolean);
}

export function matchRecognizedPlayerName(
  rawName: string,
  assignedPlayers: PlayerNameCandidate[]
): PlayerNameMatch {
  const normalizedRaw = normalize(rawName);
  if (!normalizedRaw) {
    return { rawName, matchedPlayerId: null, matchedPlayerName: null, confidence: 0, method: 'unmatched', alternatives: [] };
  }

  const exact = assignedPlayers.filter((player) => normalize(player.name) === normalizedRaw);
  if (exact.length === 1) {
    return { rawName, matchedPlayerId: exact[0].playerId, matchedPlayerName: exact[0].name, confidence: 1, method: 'exact', alternatives: [] };
  }

  const aliasMatches = assignedPlayers.filter((player) => aliasesFor(player.name).includes(normalizedRaw));
  if (aliasMatches.length === 1) {
    return { rawName, matchedPlayerId: aliasMatches[0].playerId, matchedPlayerName: aliasMatches[0].name, confidence: 0.99, method: 'alias', alternatives: [] };
  }
  if (aliasMatches.length > 1) {
    return {
      rawName,
      matchedPlayerId: null,
      matchedPlayerName: null,
      confidence: 0,
      method: 'ambiguous',
      alternatives: aliasMatches.map((player) => player.name)
    };
  }

  const scored = assignedPlayers
    .map((player) => {
      const candidateValues = [normalize(player.name), ...aliasesFor(player.name)];
      const score = Math.max(...candidateValues.map((candidate) => similarity(normalizedRaw, candidate)));
      return { player, score };
    })
    .sort((first, second) => second.score - first.score);

  const best = scored[0];
  const runnerUp = scored[1];
  if (best && best.score >= 0.72 && (!runnerUp || best.score - runnerUp.score >= 0.08)) {
    return {
      rawName,
      matchedPlayerId: best.player.playerId,
      matchedPlayerName: best.player.name,
      confidence: Math.min(0.95, best.score),
      method: 'fuzzy',
      alternatives: runnerUp && runnerUp.score >= 0.65 ? [runnerUp.player.name] : []
    };
  }

  return {
    rawName,
    matchedPlayerId: null,
    matchedPlayerName: null,
    confidence: best?.score ?? 0,
    method: best && best.score >= 0.55 ? 'ambiguous' : 'unmatched',
    alternatives: scored.filter((item) => item.score >= 0.55).slice(0, 3).map((item) => item.player.name)
  };
}
