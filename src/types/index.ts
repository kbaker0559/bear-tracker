export type Player = {
  id: string;
  name: string;
  handicap: number;
  quota: number;
  pin: string;
  active: boolean;
  isAdmin?: boolean;
};

export type Hole = {
  number: number;
  par: number;
  strokeIndex: number;
};

export type ScoreMap = Record<string, Record<number, number | null>>;

export type Group = {
  id: string;
  name: string;
  playerIds: string[];
  scorekeeperIds: string[];
};

export type PlayerRoundResult = {
  playerId: string;
  name: string;
  grossTotal: number;
  netTotal: number;
  points: number;
  quota: number;
  quotaDelta: number;
  thru: number;
};

export type SkinResult = {
  hole: number;
  winnerId: string | null;
  winnerName: string | null;
  netScore: number | null;
  status: 'pending' | 'skin' | 'no-skin';
};
