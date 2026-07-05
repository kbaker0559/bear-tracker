import type { Hole, Player, PlayerRoundResult, Score, SkinResult } from '../types/models';

export function strokesOnHole(handicap: number, holeRank: number): number {
  if (handicap <= 0) return 0;
  const base = Math.floor(handicap / 18);
  const extra = handicap % 18;
  return base + (holeRank <= extra ? 1 : 0);
}

export function netScore(gross: number, player: Player, hole: Hole): number {
  return gross - strokesOnHole(player.handicap, hole.handicapRank);
}

export function stablefordPoints(net: number, par: number): number {
  const diff = net - par;
  if (diff <= -3) return 8;
  if (diff === -2) return 6;
  if (diff === -1) return 4;
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}

export function summarizePlayer(player: Player, holes: Hole[], scores: Score[]): PlayerRoundResult {
  const playerScores = scores.filter(s => s.playerId === player.id);
  let grossTotal = 0;
  let netTotal = 0;
  let stableford = 0;
  for (const score of playerScores) {
    const hole = holes.find(h => h.number === score.holeNumber);
    if (!hole) continue;
    const net = netScore(score.gross, player, hole);
    grossTotal += score.gross;
    netTotal += net;
    stableford += stablefordPoints(net, hole.par);
  }
  return { player, grossTotal, netTotal, stablefordPoints: stableford, quotaDiff: stableford - player.quota, holesPlayed: playerScores.length };
}

export function leaderboard(players: Player[], holes: Hole[], scores: Score[]): PlayerRoundResult[] {
  return players
    .filter(p => p.active)
    .map(p => summarizePlayer(p, holes, scores))
    .sort((a, b) => b.quotaDiff - a.quotaDiff || b.stablefordPoints - a.stablefordPoints || a.player.name.localeCompare(b.player.name));
}

export function netSkins(players: Player[], holes: Hole[], scores: Score[]): SkinResult[] {
  return holes.map(hole => {
    const nets = scores
      .filter(s => s.holeNumber === hole.number)
      .map(s => {
        const player = players.find(p => p.id === s.playerId);
        if (!player) return null;
        return { playerId: player.id, net: netScore(s.gross, player, hole) };
      })
      .filter((x): x is { playerId: string; net: number } => Boolean(x));
    if (nets.length === 0) return { holeNumber: hole.number, winnerId: null, winningNet: null, tied: false };
    const low = Math.min(...nets.map(n => n.net));
    const winners = nets.filter(n => n.net === low);
    return { holeNumber: hole.number, winnerId: winners.length === 1 ? winners[0].playerId : null, winningNet: low, tied: winners.length > 1 };
  });
}

export function quotaChange(quotaDiff: number, cashed: boolean): number {
  if (quotaDiff <= -10) return -4;
  if (quotaDiff <= -6) return -3;
  if (quotaDiff <= -3) return -2;
  if (quotaDiff <= -1) return -1;
  if (!cashed) return 0;
  if (quotaDiff <= 2) return 1;
  if (quotaDiff <= 4) return 2;
  if (quotaDiff <= 6) return 3;
  if (quotaDiff <= 9) return 4;
  return Math.ceil(quotaDiff / 2);
}
