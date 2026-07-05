export type Player = {
  id: string;
  name: string;
  handicap: number;
  quota: number;
  pin: string;
  active: boolean;
};

export type Hole = {
  number: number;
  par: number;
  strokeIndex: number;
};

export type Score = {
  playerId: string;
  holeNumber: number;
  gross: number;
};

export type PlayerRoundSummary = {
  player: Player;
  holesPlayed: number;
  grossTotal: number;
  netTotal: number;
  stablefordPoints: number;
  quotaPlusMinus: number;
};

export type SkinResult = {
  holeNumber: number;
  winnerPlayerId: string | null;
  winningNetScore: number | null;
  tiedPlayerIds: string[];
};

export type PayoutPlace = {
  place: number;
  amount: number;
};

export type PlayerPayout = {
  playerId: string;
  placePayout: number;
  skinsPayout: number;
  totalPayout: number;
};
