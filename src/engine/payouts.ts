import type { LeaderboardRow, PayoutPlace, PayoutResult } from '../types/domain';

export function paidPlacesForPlayerCount(playerCount: number): number {
  if (playerCount >= 16) return 5;
  if (playerCount >= 9) return 4;
  return 0;
}

export function defaultPlaceAmounts(playerCount: number): PayoutPlace[] {
  const paidPlaces = paidPlacesForPlayerCount(playerCount);
  if (paidPlaces === 5) {
    return [
      { place: 1, amount: 100 },
      { place: 2, amount: 80 },
      { place: 3, amount: 60 },
      { place: 4, amount: 40 },
      { place: 5, amount: 20 }
    ];
  }
  if (paidPlaces === 4) {
    return [
      { place: 1, amount: 80 },
      { place: 2, amount: 60 },
      { place: 3, amount: 40 },
      { place: 4, amount: 20 }
    ];
  }
  return [];
}

export function calculatePlacePayouts(leaderboard: LeaderboardRow[], placeAmounts: PayoutPlace[]): PayoutResult[] {
  const paidPlaceCount = placeAmounts.length;
  if (paidPlaceCount === 0) return [];

  const payouts: PayoutResult[] = [];
  let index = 0;
  let place = 1;

  while (index < leaderboard.length && place <= paidPlaceCount) {
    const tiedRows = leaderboard.filter((row) => row.quotaDiff === leaderboard[index].quotaDiff);
    const tieStartIndex = leaderboard.findIndex((row) => row.playerId === tiedRows[0].playerId);
    if (tieStartIndex !== index) {
      index++;
      continue;
    }

    const placesCovered = Array.from({ length: tiedRows.length }, (_, offset) => place + offset).filter(
      (coveredPlace) => coveredPlace <= paidPlaceCount
    );

    if (placesCovered.length > 0) {
      const moneyPool = placesCovered.reduce((sum, coveredPlace) => {
        const placeMoney = placeAmounts.find((p) => p.place === coveredPlace)?.amount ?? 0;
        return sum + placeMoney;
      }, 0);
      const splitAmount = Math.floor(moneyPool / tiedRows.length);

      tiedRows.forEach((row) => {
        payouts.push({
          playerId: row.playerId,
          name: row.name,
          quotaDiff: row.quotaDiff,
          placesCovered,
          amount: splitAmount
        });
      });
    }

    index += tiedRows.length;
    place += tiedRows.length;
  }

  return payouts.sort((a, b) => b.quotaDiff - a.quotaDiff || a.name.localeCompare(b.name));
}
