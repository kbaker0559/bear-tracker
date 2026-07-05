export function quotaDecreaseForResult(plusMinus: number): number {
  if (plusMinus <= -10) return -4;
  if (plusMinus <= -6) return -3;
  if (plusMinus <= -3) return -2;
  if (plusMinus <= -1) return -1;
  return 0;
}

export function quotaIncreaseForCashingResult(plusMinus: number): number {
  if (plusMinus <= 0) return 0;
  if (plusMinus <= 2) return 1;
  if (plusMinus <= 4) return 2;
  if (plusMinus <= 6) return 3;
  if (plusMinus <= 9) return 4;
  return Math.ceil(plusMinus / 2);
}

export function nextQuota(currentQuota: number, plusMinus: number, cashedInPlaces: boolean): number {
  const adjustment = plusMinus < 0
    ? quotaDecreaseForResult(plusMinus)
    : cashedInPlaces
      ? quotaIncreaseForCashingResult(plusMinus)
      : 0;
  return Math.max(0, currentQuota + adjustment);
}
