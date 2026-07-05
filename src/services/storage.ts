import type { Player } from '../types/models';
import { initialPlayers } from '../data/players';

const PLAYER_STORAGE_KEY = 'bear-tracker.players.v1';

export function loadPlayers(): Player[] {
  try {
    const raw = window.localStorage.getItem(PLAYER_STORAGE_KEY);
    if (!raw) return initialPlayers;
    const parsed = JSON.parse(raw) as Player[];
    if (!Array.isArray(parsed)) return initialPlayers;
    return parsed.map(player => ({ ...player, pin: String(player.pin ?? '0000') }));
  } catch {
    return initialPlayers;
  }
}

export function savePlayers(players: Player[]): void {
  window.localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(players));
}

export function resetPlayers(): Player[] {
  window.localStorage.removeItem(PLAYER_STORAGE_KEY);
  return initialPlayers;
}

export function createPlayerId(players: Player[]): string {
  const existingNumbers = players
    .map(player => Number(player.id.replace(/^p/, '')))
    .filter(Number.isFinite);
  const next = existingNumbers.length ? Math.max(...existingNumbers) + 1 : 1;
  return `p${next}`;
}
