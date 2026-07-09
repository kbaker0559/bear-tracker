export type RoundState =
  | 'planning'
  | 'pairings-ready'
  | 'check-in-open'
  | 'round-in-progress'
  | 'reviewing'
  | 'finalized';

export type CurrentRound = {
  id: string;
  date: string;
  state: RoundState;
  expectedPlayerCount: number;
  checkedInCount: number;
  paidCount: number;
  scorecardCount: number;
};