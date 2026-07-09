export type ScorecardStatus =
  | 'scheduled'
  | 'ready'
  | 'in-progress'
  | 'complete'
  | 'needs-review';

export type ScorecardPlayer = {
  playerId: string;
  tee: string;
  handicapAtPairing: number;
};

export type Scorecard = {
  id: string;
  roundId: string;

  cardNumber: number;
  teeTime: string;

  players: ScorecardPlayer[];

  scorekeeperId?: string;

  status: ScorecardStatus;

  notes?: string;
};