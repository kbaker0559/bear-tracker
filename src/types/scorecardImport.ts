export type ScorecardImportStatus =
  | 'waiting'
  | 'processing'
  | 'needs-review'
  | 'verified'
  | 'complete'
  | 'import-failed';

export type ScoreConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'missing';

export type ExtractedScoreCell = {
  playerId: string;
  holeNumber: number;

  extractedScore: number | null;
  confirmedScore: number | null;

  confidence: ScoreConfidence;

  requiresReview: boolean;
  reviewReason?: string;
};

export type ScorecardImportIssueType =
  | 'unreadable-score'
  | 'missing-score'
  | 'invalid-score'
  | 'unexpected-player'
  | 'missing-player'
  | 'duplicate-player'
  | 'player-name-mismatch'
  | 'other';

export type ScorecardImportIssue = {
  id: string;
  type: ScorecardImportIssueType;
  message: string;

  playerId?: string;
  holeNumber?: number;

  resolved: boolean;
  resolutionNotes?: string;
};

export type ScorecardImport = {
  id: string;
  roundId: string;
  scorecardId: string;

  status: ScorecardImportStatus;

  imageName?: string;
  imageUrl?: string;

  extractedAt?: string;
  verifiedAt?: string;
  completedAt?: string;

  cells: ExtractedScoreCell[];
  issues: ScorecardImportIssue[];

  verifiedByPlayerId?: string;
  notes?: string;
};