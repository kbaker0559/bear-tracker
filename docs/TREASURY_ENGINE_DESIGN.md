# Bear Tracker Treasury Engine Design

## Purpose

The Treasury Engine tracks every movement of tournament money from collection through payout, credit, transfer, and reconciliation.

It must answer three questions at all times:

1. How much money belongs to the current round?
2. How much money is physically in the Owe envelope?
3. Which players have been paid, credited, or are still unresolved?

## Core Principle

Every financial action is recorded as a transaction with:

- Amount
- Player
- Source location
- Destination location
- Reason
- Round
- Timestamp
- User
- Related award or entry, when applicable

Balances are calculated from transactions. They are not edited directly.

## Cash Locations

### Current Round Pot

Cash available for the active round.

Sources may include:

- New cash entry fees
- Transfers from the Owe envelope
- Other approved adjustments

Uses may include:

- Places payouts
- Skins payouts
- Greenies payouts
- Horse's Ass payouts
- Transfers to the Owe envelope

### Owe Envelope

Cash physically held for players who left before being paid.

Each envelope balance must remain tied to:

- Player
- Original round
- Original award entries
- Amount still outstanding

### Paid Out

Money physically handed to a player.

This is a destination for completed cash payouts and is retained for audit history.

## Transaction Types

Recommended transaction types:

- `entry-cash-received`
- `entry-credit-applied`
- `owe-envelope-created`
- `owe-envelope-to-round-pot`
- `award-paid-cash`
- `award-moved-to-owe-envelope`
- `credit-paid-out-cash`
- `manual-adjustment`

## Treasury Transaction

```ts
export type TreasuryTransactionType =
  | 'entry-cash-received'
  | 'entry-credit-applied'
  | 'owe-envelope-created'
  | 'owe-envelope-to-round-pot'
  | 'award-paid-cash'
  | 'award-moved-to-owe-envelope'
  | 'credit-paid-out-cash'
  | 'manual-adjustment';

export type CashLocation =
  | 'outside'
  | 'current-round-pot'
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
```

## Award Entries

Places, Skins, Greenies, and Horse's Ass each create award entries.

```ts
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
```

## Cash Settlement Views

### By Award Category

Primary Treasurer workflow:

1. Greenies
2. Places and Horse's Ass
3. Skins

Each entry may be marked:

- Paid Cash
- Player Left — Owe Envelope

Batch actions may mark an entire category paid, but individual entries remain editable afterward.

### By Player

Each player snapshot shows:

- Places
- Skins
- Greenies
- Horse's Ass
- Total winnings
- Paid in cash
- Moved to Owe envelope
- Still unresolved

A player is fully settled when every award entry is either paid in cash or moved to the Owe envelope.

## Player Left Workflow

When Cam selects **Player Left — Owe Envelope**:

1. Show an alert:
   - “Place $XX in the Owe envelope for Player Name.”
2. Require confirmation.
3. Create a transaction:
   - Source: Current Round Pot
   - Destination: Owe Envelope
4. Mark the award entry as `moved-to-owe-envelope`.
5. Add the amount to the player's outstanding credit balance.
6. Add a Tournament Event Log entry.
7. Remove the amount from cash still to hand out.

## Applying Credit to a Future Entry

When a player uses prior winnings toward the current entry:

1. Show available Owe-envelope balance and source round.
2. Cam selects the amount to apply.
3. Alert:
   - “Move $XX from Player Name's Owe envelope to the current round pot.”
4. Require **Cash Moved — Apply Credit** confirmation.
5. Create a transaction:
   - Source: Owe Envelope
   - Destination: Current Round Pot
6. Reduce the player's outstanding balance.
7. Apply the amount to the current entry.
8. Mark the entry paid when fully funded.
9. Add a Tournament Event Log entry.

The entry must remain pending until the physical cash transfer is confirmed.

## Reconciliation

The Treasury Dashboard should display:

- New cash received
- Transferred from Owe envelope
- Total current-round funding
- Awards paid in cash
- Awards moved to Owe envelope
- Cash remaining in current-round pot
- Total physically in Owe envelope
- Unresolved award entries
- Difference

A round cannot be finalized while:

- Any award entry is unsettled
- A required Owe-envelope transfer is unconfirmed
- Reconciliation difference is not zero
- Required payout calculations are incomplete

## Audit Rules

- Treasury transactions are immutable.
- Corrections are entered as reversing and replacement transactions.
- Every payout adjustment retains calculated amount, official amount, and reason.
- Every transfer records source and destination.
- Every batch settlement produces individual award-level settlement records.

## Version 1.0 Scope

Required:

- Award entries
- Pay by category
- Player settlement snapshot
- Paid Cash
- Player Left — Owe Envelope
- Owe-envelope credit balance
- Physical transfer confirmation when credit is applied
- Treasury reconciliation
- Tournament Event Log integration

Later:

- Treasurer roles and permissions
- Printed player receipts
- Long-term treasury reports
- Cash denomination planning
- Multi-device synchronization
