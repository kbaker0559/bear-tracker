import type { PlayerPayout, PlayerRoundSummary, PayoutPlace, SkinResult } from '../types/domain';

export function paidPlacesForPlayerCount(playerCount: number): number {
  if (playerCount >= 16) return 5;
  if (playerCount >= 9) return 4;
  return 0;
}

export function calculatePlacePayouts(leaderboard: PlayerRoundSummary[], placeAmounts: PayoutPlace[]): PlayerPayout[] {
  const payouts = new Map<string, PlayerPayout>();
  leaderboard.forEach(row => payouts.set(row.player.id, { playerId: row.player.id, placePayout: 0, skinsPayout: 0, totalPayout: 0 }));

  let index = 0;
  while (index < leaderboard.length) {
    const tied = leaderboard.filter(row => row.quotaPlusMinus === leaderboard[index].quotaPlusMinus);
    const tiedAtOrAfterIndex = tied.filter(row => leaderboard.indexOf(row) >= index);
    const startPlace = index + 1;
    const endPlace = index + tiedAtOrAfterIndex.length;
    const pool = placeAmounts
      .filter(place => place.place >= startPlace && place.place <= endPlace)
      .reduce((sum, place) => sum + place.amount, 0);

    if (pool > 0) {
      const split = Math.floor(pool / tiedAtOrAfterIndex.length);
      tiedAtOrAfterIndex.forEach(row => {
        const payout = payouts.get(row.player.id);
        if (payout) {
          payout.placePayout += split;
          payout.totalPayout += split;
        }
      });
    }
    index = endPlace;
  }

  return Array.from(payouts.values());
}

export function addSkinPayouts(basePayouts: PlayerPayout[], skins: SkinResult[], skinValue: number): PlayerPayout[] {
  const payouts = new Map(basePayouts.map(payout => [payout.playerId, { ...payout }]));
  skins.forEach(skin => {
    if (!skin.winnerPlayerId) return;
    const payout = payouts.get(skin.winnerPlayerId);
    if (payout) {
      payout.skinsPayout += skinValue;
      payout.totalPayout += skinValue;
    }
  });
  return Array.from(payouts.values());
}
