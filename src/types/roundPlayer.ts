export type RoundPlayerStatus =
  | 'expected'
  | 'checked-in'
  | 'no-show'
  | 'dns'
  | 'walk-on'
  | 'withdrawn'
  | 'removed';

export type RoundPlayer = {
  roundId: string;
  playerId: string;

  status: RoundPlayerStatus;
  statusReason?: string;
  weeklyReviewed?: boolean;

  checkedIn: boolean;
  paid: boolean;

  scorecardId?: string;
  originalScorecardId?: string;
  scorekeeperForScorecardId?: string;
  originalScorekeeperForScorecardId?: string;
  storedHandicapAtPairing?: number;
  storedQuotaAtPairing?: number;

  isEligibleForPlaces: boolean;
  isEligibleForSkins: boolean;
  isEligibleForGreenies: boolean;
  isEligibleForHorseAss: boolean;

  amountPaid: number;

  cashPaid: number;
  creditApplied: number;
  paidByPlayerId?: string;
  paymentNote?: string;

  amountWon: number;
  amountOwed: number;
};
