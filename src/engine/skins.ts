import type { Hole, Player, ScoreMap, SkinResult } from '../types';
import { netScore } from './scoring';

export function skinForHole(players: Player[], hole: Hole, scores: ScoreMap): SkinResult {
  const active = players.filter((p) => p.active);
  const complete = active.every((p) => typeof scores[p.id]?.[hole.number] === 'number');
  if (!complete) {
    return { hole: hole.number, winnerId: null, winnerName: null, netScore: null, status: 'pending' };
  }

  const netScores = active.map((p) => ({
    player: p,
    net: netScore(scores[p.id][hole.number] as number, p.handicap, hole)
  }));
  const low = Math.min(...netScores.map((s) => s.net));
  const winners = netScores.filter((s) => s.net === low);

  if (winners.length !== 1) {
    return { hole: hole.number, winnerId: null, winnerName: null, netScore: low, status: 'no-skin' };
  }

  return {
    hole: hole.number,
    winnerId: winners[0].player.id,
    winnerName: winners[0].player.name,
    netScore: low,
    status: 'skin'
  };
}

export function skins(players: Player[], holes: Hole[], scores: ScoreMap): SkinResult[] {
  return holes.map((hole) => skinForHole(players, hole, scores));
}
