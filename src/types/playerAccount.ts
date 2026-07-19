export type LedgerEntryType =
  | 'winnings'
  | 'entry-fee'
  | 'cash-payment'
  | 'credit-applied'
  | 'adjustment'
  | 'refund';

export type PlayerLedgerEntry = {
  id: string;
  playerId: string;

  date: string;
  type: LedgerEntryType;
  description: string;

  /*
   * Positive amounts increase the amount owed to the player.
   * Negative amounts reduce the player's credit or increase what
   * the player owes the league.
   */
  amount: number;

  roundId?: string;
  relatedPlayerId?: string;
  notes?: string;
};

export type PlayerAccount = {
  playerId: string;
  balance: number;
  ledger: PlayerLedgerEntry[];
};