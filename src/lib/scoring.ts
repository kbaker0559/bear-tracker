import type { Hole, HoleScoreDetail, Player, PlayerResult, Score, SkinResult } from '../types';

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

export function scoreLabel(netScore: number, par: number): string {
  const diff = netScore - par;
  if (diff <= -3) return 'Double eagle or better';
  if (diff === -2) return 'Eagle';
  if (diff === -1) return 'Birdie';
  if (diff === 0) return 'Par';
  if (diff === 1) return 'Bogey';
  if (diff === 2) return 'Double bogey';
  return `${diff > 0 ? '+' : ''}${diff}`;
}

export function holeScoreDetail(player: Player, hole: Hole, scores: Score[]): HoleScoreDetail {
  const score = scores.find(s => s.playerId === player.id && s.hole === hole.hole);
  const strokes = strokesOnHole(player.handicap, hole.strokeIndex);
  if (!score) return { player, gross: null, strokes, net: null, points: null, label: 'Not entered' };
  const net = score.gross - strokes;
  return { player, gross: score.gross, strokes, net, points: stablefordPoints(net, hole.par), label: scoreLabel(net, hole.par) };
}

export function calculateResults(players: Player[], holes: Hole[], scores: Score[]): PlayerResult[] {
  return players.filter(p=>p.active).map(player => {
    let gross = 0, net = 0, points = 0, thru = 0;
    for (const hole of holes) {
      const s = scores.find(x => x.playerId === player.id && x.hole === hole.hole);
      if (!s) continue;
      const strokes = strokesOnHole(player.handicap, hole.strokeIndex);
      const netHole = s.gross - strokes;
      gross += s.gross;
      net += netHole;
      points += stablefordPoints(netHole, hole.par);
      thru++;
    }
    const quotaDiff = points - player.quota;
    const projectedPoints = thru ? Math.round((points / thru) * 18) : 0;
    return { player, gross, net, points, quotaDiff, thru, holesRemaining: 18 - thru, projectedDiff: projectedPoints - player.quota };
  }).sort((a,b)=> b.quotaDiff - a.quotaDiff || b.points - a.points || a.gross - b.gross);
}

export function calculateSkins(players: Player[], holes: Hole[], scores: Score[]): SkinResult[] {
  const active = players.filter(p=>p.active);
  return holes.map(hole => {
    const nets = active.map(player => {
      const s = scores.find(x => x.playerId === player.id && x.hole === hole.hole);
      return s ? { playerId: player.id, net: s.gross - strokesOnHole(player.handicap, hole.strokeIndex) } : null;
    }).filter(Boolean) as Array<{playerId:string; net:number}>;
    if (nets.length < active.length) return { hole: hole.hole, winnerId: null, netScore: null, status: 'pending' };
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
