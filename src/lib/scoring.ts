import type { Hole, HoleScoreDetail, PlacePayout, Player, PlayerResult, PayoutSettings, QuotaPreview, Score, SkinResult } from '../types';

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


export function paidPlacesForPlayerCount(playerCount: number): number {
  if (playerCount >= 16) return 5;
  if (playerCount >= 9) return 4;
  return 0;
}

export function defaultPlacePercentages(placesPaid: number): number[] {
  if (placesPaid === 5) return [0.34, 0.25, 0.18, 0.13, 0.10];
  if (placesPaid === 4) return [0.40, 0.30, 0.20, 0.10];
  return [];
}

export function placePrizeAmounts(placePurse: number, placesPaid: number): number[] {
  const percentages = defaultPlacePercentages(placesPaid);
  const base = percentages.map(p => Math.floor(placePurse * p));
  const used = base.reduce((sum, n) => sum + n, 0);
  if (base.length) base[0] += Math.max(0, placePurse - used);
  return base;
}

export function calculatePlacePayouts(results: PlayerResult[], placePurse: number): PlacePayout[] {
  const completed = results.filter(r => r.thru === 18);
  const placesPaid = paidPlacesForPlayerCount(completed.length);
  if (!placesPaid) return [];
  const prizes = placePrizeAmounts(placePurse, placesPaid);
  const payouts: PlacePayout[] = [];
  let currentPlace = 1;
  let index = 0;

  while (index < completed.length && currentPlace <= placesPaid) {
    const tied = completed.filter(r => r.quotaDiff === completed[index].quotaDiff);
    const tiedAtOrAfter = tied.filter(r => completed.findIndex(x => x.player.id === r.player.id) >= index);
    const tieCount = tiedAtOrAfter.length;
    const placesCovered = Array.from({ length: tieCount }, (_, i) => currentPlace + i).filter(place => place <= placesPaid);
    const moneyPool = placesCovered.reduce((sum, place) => sum + (prizes[place - 1] ?? 0), 0);
    const amountEach = tieCount ? Math.floor(moneyPool / tieCount) : 0;
    if (amountEach > 0) {
      payouts.push({
        placeLabel: tieCount === 1 ? `${currentPlace}` : `${currentPlace}-${currentPlace + tieCount - 1}`,
        playerIds: tiedAtOrAfter.map(r => r.player.id),
        amountEach,
        placesCovered
      });
    }
    currentPlace += tieCount;
    index += tieCount;
  }
  return payouts;
}

export function calculateQuotaPreview(results: PlayerResult[], skins: SkinResult[], settings: PayoutSettings): QuotaPreview[] {
  const placePayouts = calculatePlacePayouts(results, settings.placePurse);
  const skinWins = new Map<string, number>();
  for (const skin of skins) {
    if (skin.status === 'won' && skin.winnerId) skinWins.set(skin.winnerId, (skinWins.get(skin.winnerId) ?? 0) + 1);
  }
  return results.map(result => {
    const place = placePayouts.find(p => p.playerIds.includes(result.player.id));
    const placeMoney = place?.amountEach ?? 0;
    const skinMoney = (skinWins.get(result.player.id) ?? 0) * settings.skinValue;
    const inMoney = placeMoney > 0;
    const adjustment = quotaAdjustment(result.quotaDiff, inMoney);
    return {
      playerId: result.player.id,
      currentQuota: result.player.quota,
      points: result.points,
      quotaDiff: result.quotaDiff,
      inMoney,
      adjustment,
      nextQuota: Math.max(0, result.player.quota + adjustment),
      placeMoney,
      skinMoney,
      totalMoney: placeMoney + skinMoney
    };
  });
}
