export function baseQuotaChange(quotaDiff: number): number {
  if (quotaDiff <= -10) return -4;
  if (quotaDiff <= -6) return -3;
  if (quotaDiff <= -3) return -2;
  if (quotaDiff <= -1) return -1;
  if (quotaDiff === 0) return 0;
  if (quotaDiff <= 2) return 1;
  if (quotaDiff <= 4) return 2;
  if (quotaDiff <= 6) return 3;
  if (quotaDiff <= 9) return 4;
  return Math.ceil(quotaDiff / 2);
}

export function quotaChangeAfterMoneyRule(quotaDiff: number, wonPlaceMoney: boolean): number {
  const change = baseQuotaChange(quotaDiff);
  if (change > 0 && !wonPlaceMoney) return 0;
  return change;
}
