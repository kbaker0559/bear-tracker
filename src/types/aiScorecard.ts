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
};

export type ScorecardRecognitionResult = {
  provider: AIProvider;
  model: string;
  players: RecognizedPlayer[];
  warnings: string[];
};
