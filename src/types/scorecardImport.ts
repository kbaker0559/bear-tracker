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
  rawExtractedScore?: number | null;
  extractedNetScore?: number | null;
  recognitionConfidence?: number;
  confirmedScore: number | null;

  confidence: ScoreConfidence;

  requiresReview: boolean;
  reviewReason?: string;
  correctedByValidation?: boolean;
  validationNotes?: string[];
};


export type RecognitionDecision = {
  id: string;
  playerId: string;
  holeNumber: number;
  originalScore: number | null;
  recommendedScore: number;
  appliedAutomatically: boolean;
  confidenceAfterValidation: number;
  reasons: string[];
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


export type ScorecardPlayerTotalsReview = {
  playerId: string;
  calculatedFrontNine: number | null;
  calculatedBackNine: number | null;
  calculatedTotal: number | null;
  handwrittenFrontNine: number | null;
  handwrittenBackNine: number | null;
  handwrittenTotal: number | null;
  frontNineMatches: boolean | null;
  backNineMatches: boolean | null;
  totalMatches: boolean | null;
};

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
  originalImageUrl?: string;
  imageUrl?: string;
  imagePreparation?: {
    autoCropped: boolean;
    rotated: boolean;
    message: string;
  };

  extractedAt?: string;
  verifiedAt?: string;
  completedAt?: string;

  cells: ExtractedScoreCell[];
  issues: ScorecardImportIssue[];
  playerTotals?: ScorecardPlayerTotalsReview[];
  recognitionDecisions?: RecognitionDecision[];

  verifiedByPlayerId?: string;
  notes?: string;
};