import type { Player, ScoreMap } from './index';

export interface Scorecard {
  id: string;
  name: string;
  playerIds: string[];
}

export interface Round {
  id: string;
  date: string;
  players: string[];
  scorecards: Scorecard[];
  scores: ScoreMap;
  completed: boolean;
}