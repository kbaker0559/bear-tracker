export type RoundStatus =
  | 'checkin'
  | 'scorecards'
  | 'scoring'
  | 'review'
  | 'finalized';

export type Season = {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  active: boolean;
};

export type LeaguePlayer = {
  id: string;
  firstName: string;
  lastName: string;
  suffix?: string;
  displayName: string;
  handicap: number;
  quota: number;
  active: boolean;
};

export type Round = {
  id: string;
  seasonId: string;
  date: string;
  courseId: string;
  status: RoundStatus;
};

export type Scorecard = {
  id: string;
  roundId: string;
  cardNumber: number;
  playerIds: string[];
  scorekeeperId?: string;
};

export type HoleScore = {
  id: string;
  roundId: string;
  scorecardId: string;
  playerId: string;
  holeNumber: number;
  gross: number | null;
};

export type FinalRoundResult = {
  roundId: string;
  playerId: string;
  grossTotal: number;
  stablefordPoints: number;
  quota: number;
  quotaDelta: number;
  placePayout: number;
  skinsPayout: number;
  totalPayout: number;
  nextQuota: number;
};