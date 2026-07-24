export type AwardCategory =
  | 'place'
  | 'skin'
  | 'greenie'
  | 'horse-ass';

export type AwardSettlementStatus =
  | 'unsettled'
  | 'paid-cash'
  | 'moved-to-owe-envelope';

export type AwardEntry = {
  id: string;
  roundId: string;
  playerId: string;

  category: AwardCategory;
  label: string;

  calculatedAmount: number;
  officialAmount: number;
  adjustmentReason?: string;

  settlementStatus: AwardSettlementStatus;
  settledAt?: string;
  treasuryTransactionId?: string;
};
