import type { Hole, HoleResult, LeaderboardRow, Player, Score } from '../types/domain';

export function strokesReceivedForHole(playerHandicap: number, holeHandicapRank: number): number {
  if (playerHandicap <= 0) return 0;
  const fullRounds = Math.floor(playerHandicap / 18);
  const remainder = playerHandicap % 18;
  return fullRounds + (holeHandicapRank <= remainder ? 1 : 0);
}

export function stablefordPoints(netScore: number, par: number): number {
  const relativeToPar = netScore - par;
  if (relativeToPar <= -3) return 8;
  if (relativeToPar === -2) return 6;
  if (relativeToPar === -1) return 4;
  if (relativeToPar === 0) return 2;
  if (relativeToPar === 1) return 1;
  return 0;
}

export function evaluateScore(player: Player, hole: Hole, score: Score): HoleResult {
  const strokesReceived = strokesReceivedForHole(player.handicap, hole.handicapRank);
  const net = score.gross - strokesReceived;
  return {
    playerId: player.id,
    holeNumber: hole.number,
    gross: score.gross,
    strokesReceived,
    net,
    stablefordPoints: stablefordPoints(net, hole.par)
  };
}

export function evaluateScores(players: Player[], holes: Hole[], scores: Score[]): HoleResult[] {
  return scores.map((score) => {
    const player = players.find((p) => p.id === score.playerId);
    const hole = holes.find((h) => h.number === score.holeNumber);
    if (!player) throw new Error(`Missing player for score: ${score.playerId}`);
    if (!hole) throw new Error(`Missing hole for score: ${score.holeNumber}`);
    return evaluateScore(player, hole, score);
  });
}

export function buildLeaderboard(players: Player[], results: HoleResult[]): LeaderboardRow[] {
  return players
    .filter((p) => p.active)
    .map((player) => {
      const playerResults = results.filter((r) => r.playerId === player.id);
      const stablefordTotal = playerResults.reduce((sum, r) => sum + r.stablefordPoints, 0);
      return {
        playerId: player.id,
        name: player.name,
        quota: player.quota,
        holesPlayed: playerResults.length,
        stablefordPoints: stablefordTotal,
        quotaDiff: stablefordTotal - player.quota
      };
    })
    .sort((a, b) => b.quotaDiff - a.quotaDiff || b.stablefordPoints - a.stablefordPoints || a.name.localeCompare(b.name));
}
