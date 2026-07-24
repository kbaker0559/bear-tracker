export type TreasuryTransactionType =
  | 'entry-cash-received'
  | 'entry-credit-applied'
  | 'owe-envelope-created'
  | 'owe-envelope-to-round-pot'
  | 'owe-envelope-to-hole-in-one-pot'
  | 'award-paid-cash'
  | 'award-moved-to-owe-envelope'
  | 'credit-paid-out-cash'
  | 'manual-adjustment';

export type CashLocation =
  | 'outside'
  | 'current-round-pot'
  | 'hole-in-one-pot'
  | 'owe-envelope'
  | 'paid-out';

export type TreasuryTransaction = {
  id: string;
  type: TreasuryTransactionType;

  roundId: string;
  playerId?: string;
  relatedRoundId?: string;
  awardEntryId?: string;

  amount: number;
  source: CashLocation;
  destination: CashLocation;

  reason: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
};
