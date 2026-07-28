export type AIProvider = 'openai';

export type AIConnectionStatus = {
  configured: boolean;
  provider: AIProvider;
  model: string;
  message: string;
};

export type RecognizedScore = {
  holeNumber: number;
  score: number | null;
  confidence: number;
  reviewReason?: string;
};

export type RecognizedPlayer = {
  name: string;
  confidence: number;
  scores: RecognizedScore[];
  netScores: RecognizedScore[];
  handwrittenFrontNine: number | null;
  handwrittenBackNine: number | null;
  handwrittenTotal: number | null;
};

export type ScorecardRecognitionResult = {
  provider: AIProvider;
  model: string;
  players: RecognizedPlayer[];
  warnings: string[];
};

export type RecognizedIdentityName = {
  rawName: string;
  confidence: number;
};

export type ScorecardIdentityRecognitionResult = {
  provider: AIProvider;
  model: string;
  cardNumber: number | null;
  cardNumberConfidence: number;
  teeTime: string | null;
  teeTimeConfidence: number;
  playerNames: RecognizedIdentityName[];
  warnings: string[];
};

export type MatchedRecognizedPlayer = RecognizedIdentityName & {
  matchedPlayerId: string | null;
  matchedPlayerName: string | null;
  matchConfidence: number;
  matchMethod: 'exact' | 'alias' | 'fuzzy' | 'ambiguous' | 'unmatched';
  alternatives: string[];
};

export type ScorecardIdentityReview = ScorecardIdentityRecognitionResult & {
  expectedCardNumber: number;
  expectedTeeTime: string;
  cardNumberMatches: boolean | null;
  teeTimeMatches: boolean | null;
  matchedPlayers: MatchedRecognizedPlayer[];
};
