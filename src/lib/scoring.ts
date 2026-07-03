import type { Hole, Player, PlayerResult, Score, SkinResult } from '../types';

export function strokesOnHole(handicap: number, strokeIndex: number): number {
  if (handicap <= 0) return 0;
  return Math.floor(handicap / 18) + (handicap % 18 >= strokeIndex ? 1 : 0);
}
export function stablefordPoints(netScore: number, par: number): number {
  const diff = netScore - par;
  if (diff <= -3) return 8;
  if (diff === -2) return 6;
  if (diff === -1) return 4;
  if (diff === 0) return 2;
  if (diff === 1) return 1;
  return 0;
}
export function calculateResults(players: Player[], holes: Hole[], scores: Score[]): PlayerResult[] {
  return players.filter(p=>p.active).map(player => {
    let gross = 0, net = 0, points = 0, thru = 0;
    for (const hole of holes) {
      const s = scores.find(x => x.playerId === player.id && x.hole === hole.hole);
      if (!s) continue;
      const strokes = strokesOnHole(player.handicap, hole.strokeIndex);
      const netHole = s.gross - strokes;
      gross += s.gross; net += netHole; points += stablefordPoints(netHole, hole.par); thru++;
    }
    return { player, gross, net, points, quotaDiff: points - player.quota, thru };
  }).sort((a,b)=> b.quotaDiff - a.quotaDiff || b.points - a.points || a.gross - b.gross);
}
export function calculateSkins(players: Player[], holes: Hole[], scores: Score[]): SkinResult[] {
  return holes.map(hole => {
    const nets = players.filter(p=>p.active).map(player => {
      const s = scores.find(x => x.playerId === player.id && x.hole === hole.hole);
      return s ? { playerId: player.id, net: s.gross - strokesOnHole(player.handicap, hole.strokeIndex) } : null;
    }).filter(Boolean) as Array<{playerId:string; net:number}>;
    if (nets.length < players.filter(p=>p.active).length) return { hole: hole.hole, winnerId: null, netScore: null, status: 'pending' };
    const low = Math.min(...nets.map(n=>n.net));
    const winners = nets.filter(n=>n.net === low);
    return winners.length === 1 ? { hole: hole.hole, winnerId: winners[0].playerId, netScore: low, status: 'won' } : { hole: hole.hole, winnerId: null, netScore: low, status: 'no-skin' };
  });
}
export function quotaAdjustment(diff: number, inMoney: boolean): number {
  if (diff <= -10) return -4;
  if (diff <= -6) return -3;
  if (diff <= -3) return -2;
  if (diff <= -1) return -1;
  if (diff === 0) return 0;
  if (!inMoney) return 0;
  if (diff <= 2) return 1;
  if (diff <= 4) return 2;
  if (diff <= 6) return 3;
  if (diff <= 9) return 4;
  return Math.ceil(diff / 2);
}
