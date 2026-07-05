import type { Hole, Player, PlayerRoundResult, Score, SkinResult } from '../types/models';

export function strokesReceivedOnHole(handicap: number, strokeIndex: number): number {
  if (handicap <= 0) return 0;
  const base = Math.floor(handicap / 18);
  const extra = handicap % 18 >= strokeIndex ? 1 : 0;
  return base + extra;
}

export function netScore(gross: number, handicap: number, hole: Hole): number {
  return gross - strokesReceivedOnHole(handicap, hole.strokeIndex);
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

export function calculateResults(players: Player[], holes: Hole[], scores: Score[]): PlayerRoundResult[] {
  return players.map((player) => {
    const playerScores = scores.filter((s) => s.playerId === player.id);
    let grossTotal = 0;
    let netTotal = 0;
    let stableford = 0;

    for (const score of playerScores) {
      const hole = holes.find((h) => h.number === score.hole);
      if (!hole) continue;
      const net = netScore(score.gross, player.handicap, hole);
      grossTotal += score.gross;
      netTotal += net;
      stableford += stablefordPoints(net, hole.par);
    }

    return {
      player,
      grossTotal,
      netTotal,
      stablefordPoints: stableford,
      quotaPlusMinus: stableford - player.quota,
      thru: playerScores.length
    };
  }).sort((a, b) => b.quotaPlusMinus - a.quotaPlusMinus || b.stablefordPoints - a.stablefordPoints);
}

export function calculateNetSkins(players: Player[], holes: Hole[], scores: Score[]): SkinResult[] {
  return holes.map((hole) => {
    const holeScores = scores.filter((s) => s.hole === hole.number);
    if (holeScores.length === 0) {
      return { hole: hole.number, winnerPlayerId: null, winningNetScore: null, tied: false };
    }

    const netScores = holeScores.map((score) => {
      const player = players.find((p) => p.id === score.playerId);
      if (!player) throw new Error(`Unknown player ${score.playerId}`);
      return { playerId: player.id, net: netScore(score.gross, player.handicap, hole) };
    });

    const lowest = Math.min(...netScores.map((s) => s.net));
    const lowestPlayers = netScores.filter((s) => s.net === lowest);

    if (lowestPlayers.length !== 1) {
      return { hole: hole.number, winnerPlayerId: null, winningNetScore: lowest, tied: true };
    }

    return { hole: hole.number, winnerPlayerId: lowestPlayers[0].playerId, winningNetScore: lowest, tied: false };
  });
}

export function quotaAdjustment(plusMinus: number, inTheMoney: boolean): number {
  if (plusMinus <= -10) return -4;
  if (plusMinus <= -6) return -3;
  if (plusMinus <= -3) return -2;
  if (plusMinus <= -1) return -1;
  if (plusMinus === 0) return 0;
  if (!inTheMoney) return 0;
  if (plusMinus <= 2) return 1;
  if (plusMinus <= 4) return 2;
  if (plusMinus <= 6) return 3;
  if (plusMinus <= 9) return 4;
  return Math.ceil(plusMinus / 2);
}
