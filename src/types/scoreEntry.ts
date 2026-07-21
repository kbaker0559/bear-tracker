export type ScoreEntryStatus =
  | 'not-started'
  | 'in-progress'
  | 'complete'
  | 'verified';

export type HoleScore = {
  holeNumber: number;

  grossScore: number | null;
  handicapStrokes: number | null;
  netScore: number | null;
  stablefordPoints: number | null;
};

export type PlayerScoreEntry = {
  playerId: string;

  courseHandicap: number;
  quota: number;

  scores: HoleScore[];

  frontNineGrossTotal: number | null;
  backNineGrossTotal: number | null;
  grossTotal: number | null;

  frontNineNetTotal: number | null;
  backNineNetTotal: number | null;
  netTotal: number | null;

  frontNinePoints: number | null;
  backNinePoints: number | null;
  stablefordPoints: number | null;

  quotaResult: number | null;
};

export type ScorecardEntry = {
  id: string;
  roundId: string;
  scorecardId: string;

  status: ScoreEntryStatus;

  players: PlayerScoreEntry[];

  startedAt?: string;
  completedAt?: string;
  verifiedAt?: string;

  notes?: string;
};