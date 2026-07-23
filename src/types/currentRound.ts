export type RoundState =
  | 'planning'
  | 'pairings-ready'
  | 'registration-open'
  | 'registration-closing'
  | 'ready-to-start'
  | 'round-live'
  | 'scoring-complete'
  | 'payouts'
  | 'financial-closeout'
  | 'archived'
  | 'completed';  

export type CurrentRound = {
  id: string;
  date: string;
  state: RoundState;

  expectedPlayerCount: number;
  checkedInCount: number;
  paidCount: number;
  scorecardCount: number;
};