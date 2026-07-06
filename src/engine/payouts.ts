import type { PlayerRoundSummary, PayoutResult, PlacePayout } from '../types';

export function paidPlaces(playerCount: number): number {
  if (playerCount >= 16) return 5;
  if (playerCount >= 9) return 4;
  return 0;
}

export function calculatePlacePayouts(board: PlayerRoundSummary[], placeMoney: number[]): PayoutResult {
  const activeBoard = board.filter(b => b.thru > 0);
  const placesToPay = Math.min(paidPlaces(activeBoard.length), placeMoney.length);
  const payouts: PlacePayout[] = [];
  let position = 1;
  let i = 0;

  while (i < activeBoard.length && position <= placesToPay) {
    const score = activeBoard[i].plusMinus;
    const tied = activeBoard.slice(i).filter(b => b.plusMinus === score);
    const tiedCount = tied.length;
    const placesCovered = Array.from({ length: tiedCount }, (_, idx) => position + idx).filter(place => place <= placesToPay);
    const moneyPool = placesCovered.reduce((sum, place) => sum + (placeMoney[place - 1] ?? 0), 0);
    const amountEach = moneyPool > 0 ? Math.floor(moneyPool / tiedCount) : 0;

    for (const tiedPlayer of tied) {
      payouts.push({
        playerId: tiedPlayer.player.id,
        playerName: tiedPlayer.player.name,
        placeStart: position,
        placeEnd: position + tiedCount - 1,
        plusMinus: score,
        amount: amountEach,
        inMoney: amountEach > 0
      });
    }

    i += tiedCount;
    position += tiedCount;
  }

  return {
    placesPaid: placesToPay,
    payouts,
    totalPaid: payouts.reduce((sum, payout) => sum + payout.amount, 0)
  };
}

export function totalSkinsWonByPlayer(playerIds: string[], skinWinners: Array<{ winnerId?: string; status: string }>): Record<string, number> {
  const totals = Object.fromEntries(playerIds.map(id => [id, 0]));
  for (const skin of skinWinners) {
    if (skin.status === 'won' && skin.winnerId) totals[skin.winnerId] = (totals[skin.winnerId] ?? 0) + 1;
  }
  return totals;
}
