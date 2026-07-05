import type { Hole, Player, PlayerRoundSummary, Score } from '../types/domain';

export function strokesReceivedOnHole(handicap: number, strokeIndex: number): number {
  if (handicap <= 0) return 0;
  const base = Math.floor(handicap / 18);
  const remainder = handicap % 18;
  return base + (strokeIndex <= remainder ? 1 : 0);
}

export function netScore(gross: number, handicap: number, strokeIndex: number): number {
  return gross - strokesReceivedOnHole(handicap, strokeIndex);
}

export function stablefordPoints(net: number, par: number): number {
  const relationToPar = net - par;
  if (relationToPar <= -3) return 8;
  if (relationToPar === -2) return 6;
  if (relationToPar === -1) return 4;
  if (relationToPar === 0) return 2;
  if (relationToPar === 1) return 1;
  return 0;
}

export function summarizePlayerRound(player: Player, holes: Hole[], scores: Score[]): PlayerRoundSummary {
  const playerScores = scores.filter(score => score.playerId === player.id);
  const totals = playerScores.reduce(
    (acc, score) => {
      const hole = holes.find(h => h.number === score.holeNumber);
      if (!hole) return acc;
      const net = netScore(score.gross, player.handicap, hole.strokeIndex);
      acc.grossTotal += score.gross;
      acc.netTotal += net;
      acc.stablefordPoints += stablefordPoints(net, hole.par);
      return acc;
    },
    { grossTotal: 0, netTotal: 0, stablefordPoints: 0 }
  );

  return {
    player,
    holesPlayed: playerScores.length,
    grossTotal: totals.grossTotal,
    netTotal: totals.netTotal,
    stablefordPoints: totals.stablefordPoints,
    quotaPlusMinus: totals.stablefordPoints - player.quota
  };
}

export function leaderboard(players: Player[], holes: Hole[], scores: Score[]): PlayerRoundSummary[] {
  return players
    .filter(player => player.active)
    .map(player => summarizePlayerRound(player, holes, scores))
    .sort((a, b) => {
      if (b.quotaPlusMinus !== a.quotaPlusMinus) return b.quotaPlusMinus - a.quotaPlusMinus;
      if (b.stablefordPoints !== a.stablefordPoints) return b.stablefordPoints - a.stablefordPoints;
      return a.player.name.localeCompare(b.player.name);
    });
}
