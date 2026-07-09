export type RoundPlayerStatus =
  | 'expected'
  | 'checked-in'
  | 'no-show'
  | 'walk-on'
  | 'withdrawn';

export type RoundPlayer = {
  roundId: string;
  playerId: string;

  status: RoundPlayerStatus;

  checkedIn: boolean;
  paid: boolean;

  scorecardId?: string;
  scorekeeperForScorecardId?: string;

  isEligibleForPlaces: boolean;
  isEligibleForSkins: boolean;
  isEligibleForGreenies: boolean;
  isEligibleForHorseAss: boolean;

  amountPaid: number;
  amountWon: number;
  amountOwed: number;
};