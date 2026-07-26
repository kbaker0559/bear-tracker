export type QuotaUpdate = {
  id: string;
  roundId: string;
  playerId: string;

  oldQuota: number;
  quotaResult: number;
  inMoney: boolean;
  isHorseAssWinner: boolean;

  calculatedAdjustment: number;
  minimumQuotaApplied?: boolean;
  officialAdjustment: number;
  newQuota: number;

  overrideReason?: string;
  reviewed: boolean;
  appliedAt?: string;
};
