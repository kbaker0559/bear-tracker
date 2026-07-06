import type { Hole, Player, PlayerRoundResult, ScoreMap } from '../types';

export function strokesOnHole(handicap: number, strokeIndex: number): number {
  if (handicap <= 0) return 0;
  const base = Math.floor(handicap / 18);
  const remainder = handicap % 18;
  return base + (strokeIndex <= remainder ? 1 : 0);
}

export function netScore(gross: number, handicap: number, hole: Hole): number {
  return gross - strokesOnHole(handicap, hole.strokeIndex);
}

export function stablefordPoints(net: number, par: number): number {
  const relative = net - par;
  if (relative <= -3) return 8;
  if (relative === -2) return 6;
  if (relative === -1) return 4;
  if (relative === 0) return 2;
  if (relative === 1) return 1;
  return 0;
}

export function playerRoundResult(player: Player, holes: Hole[], scores: ScoreMap): PlayerRoundResult {
  const playerScores = scores[player.id] ?? {};
  let grossTotal = 0;
  let netTotal = 0;
  let points = 0;
  let thru = 0;

  for (const hole of holes) {
    const gross = playerScores[hole.number];
    if (typeof gross !== 'number') continue;
    const net = netScore(gross, player.handicap, hole);
    grossTotal += gross;
    netTotal += net;
    points += stablefordPoints(net, hole.par);
    thru += 1;
  }

  return {
    playerId: player.id,
    name: player.name,
    grossTotal,
    netTotal,
    points,
    quota: player.quota,
    quotaDelta: points - player.quota,
    thru
  };
}

export function leaderboard(players: Player[], holes: Hole[], scores: ScoreMap): PlayerRoundResult[] {
  return players
    .filter((p) => p.active)
    .map((p) => playerRoundResult(p, holes, scores))
    .sort((a, b) => b.quotaDelta - a.quotaDelta || b.points - a.points || a.name.localeCompare(b.name));
}

export function quotaAdjustment(delta: number, inMoney: boolean): number {
  if (delta <= -10) return -4;
  if (delta <= -6) return -3;
  if (delta <= -3) return -2;
  if (delta <= -1) return -1;
  if (delta === 0) return 0;
  if (!inMoney) return 0;
  if (delta <= 2) return 1;
  if (delta <= 4) return 2;
  if (delta <= 6) return 3;
  if (delta <= 9) return 4;
  return Math.ceil(delta / 2);
}
