export type ScoreCorrectionReason =
  | 'paper-card-error'
  | 'player-confirmed'
  | 'score-entry-error'
  | 'rules-correction'
  | 'other';

export type ScoreCorrection = {
  id: string;

  roundId: string;
  scorecardId: string;
  playerId: string;
  holeNumber: number;

  originalGrossScore: number | null;
  correctedGrossScore: number | null;

  originalNetScore: number | null;
  correctedNetScore: number | null;

  originalStablefordPoints: number | null;
  correctedStablefordPoints: number | null;

  reasonType: ScoreCorrectionReason;
  reason: string;

  correctedBy: string;
  correctedAt: string;
};