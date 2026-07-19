import type {
  LedgerEntryType,
  PlayerAccount,
  PlayerLedgerEntry
} from '../types/playerAccount';

export type AddLedgerEntryInput = {
  playerId: string;
  date: string;
  type: LedgerEntryType;
  description: string;
  amount: number;
  roundId?: string;
  relatedPlayerId?: string;
  notes?: string;
};

export function createPlayerAccount(playerId: string): PlayerAccount {
  return {
    playerId,
    balance: 0,
    ledger: []
  };
}

export function calculateAccountBalance(
  ledger: PlayerLedgerEntry[]
): number {
  return ledger.reduce((total, entry) => total + entry.amount, 0);
}

export function addLedgerEntry(
  account: PlayerAccount,
  input: AddLedgerEntryInput
): PlayerAccount {
  if (account.playerId !== input.playerId) {
    throw new Error('Ledger entry player does not match the account.');
  }

  const entry: PlayerLedgerEntry = {
    id: crypto.randomUUID(),
    playerId: input.playerId,
    date: input.date,
    type: input.type,
    description: input.description,
    amount: input.amount,
    roundId: input.roundId,
    relatedPlayerId: input.relatedPlayerId,
    notes: input.notes
  };

  const ledger = [entry, ...account.ledger];

  return {
    ...account,
    ledger,
    balance: calculateAccountBalance(ledger)
  };
}

export function availablePlayerCredit(account: PlayerAccount): number {
  return Math.max(account.balance, 0);
}

export function amountPlayerOwes(account: PlayerAccount): number {
  return Math.max(-account.balance, 0);
}