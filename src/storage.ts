import type { Group, Player } from './types';
import type { Score } from './types/models';
import { initialPlayers } from './data/players';

const PLAYERS_KEY = 'bear-tracker.players.v3';
const SCORES_KEY = 'bear-tracker.scores.v3';
const GROUPS_KEY = 'bear-tracker.groups.v3';

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
  window.localStorage.removeItem(GROUPS_KEY);
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

export function loadGroups(): Group[] {
  try {
    const raw = window.localStorage.getItem(GROUPS_KEY);
    if (!raw) return makeDefaultGroups(initialPlayers.filter((p) => p.active).map((p) => p.id));
    const parsed = JSON.parse(raw) as Group[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveGroups(groups: Group[]): void {
  window.localStorage.setItem(GROUPS_KEY, JSON.stringify(groups));
}

export function makeDefaultGroups(playerIds: string[], groupSize = 4): Group[] {
  const groups: Group[] = [];
  for (let index = 0; index < playerIds.length; index += groupSize) {
    const ids = playerIds.slice(index, index + groupSize);
    groups.push({
      id: crypto.randomUUID(),
      name: `Group ${groups.length + 1}`,
      playerIds: ids,
      scorekeeperIds: ids.length ? [ids[0]] : []
    });
  }
  return groups;
}
