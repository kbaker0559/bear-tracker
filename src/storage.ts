import type { Player, Score } from './types/models';
import { initialPlayers } from './data/players';

const PLAYERS_KEY = 'bear-tracker.players.v2';
const SCORES_KEY = 'bear-tracker.scores.v2';

export function loadPlayers(): Player[] {
  try {
    const raw = window.localStorage.getItem(PLAYERS_KEY);
    if (!raw) return initialPlayers;
    const parsed = JSON.parse(raw) as Player[];
    return Array.isArray(parsed) ? parsed : initialPlayers;
  } catch {
    return initialPlayers;
  }
}

export function savePlayers(players: Player[]): void {
  window.localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

export function resetPlayers(): Player[] {
  window.localStorage.removeItem(PLAYERS_KEY);
  return initialPlayers;
}

export function loadScores(): Score[] {
  try {
    const raw = window.localStorage.getItem(SCORES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Score[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveScores(scores: Score[]): void {
  window.localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

export function clearScores(): void {
  window.localStorage.removeItem(SCORES_KEY);
}
