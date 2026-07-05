export type Player = {
  id: string;
  name: string;
  handicap: number;
  quota: number;
  pin?: string;
  active: boolean;
};

export type Hole = {
  number: number;
  par: number;
  handicapRank: number;
};

export type Score = {
  playerId: string;
  holeNumber: number;
  gross: number;
};

export type HoleResult = {
  playerId: string;
  holeNumber: number;
  gross: number;
  strokesReceived: number;
  net: number;
  stablefordPoints: number;
};

export type LeaderboardRow = {
  playerId: string;
  name: string;
  quota: number;
  holesPlayed: number;
  stablefordPoints: number;
  quotaDiff: number;
};

export type SkinResult = {
  holeNumber: number;
  winnerPlayerId: string | null;
  winningNet: number | null;
  tied: boolean;
};

export type PayoutPlace = {
  place: number;
  amount: number;
};

export type PayoutResult = {
  playerId: string;
  name: string;
  placesCovered: number[];
  quotaDiff: number;
  amount: number;
};
