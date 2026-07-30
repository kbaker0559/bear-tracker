import type { LeaguePlayer } from '../types/leaguePlayer';

const STORAGE_KEY = 'bear-tracker:league-players:v1';

type LeaguePlayerStoreDocument = {
  version: 1;
  updatedAt: string;
  players: LeaguePlayer[];
};

export function loadLeaguePlayers(): LeaguePlayer[] | null {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return null;
  }

  try {
    const document =
      JSON.parse(storedValue) as LeaguePlayerStoreDocument;

    if (
      document.version !== 1 ||
      !Array.isArray(document.players)
    ) {
      return null;
    }

    return document.players;
  } catch {
    return null;
  }
}

export function saveLeaguePlayers(
  players: LeaguePlayer[]
): void {
  const document: LeaguePlayerStoreDocument = {
    version: 1,
    updatedAt: new Date().toISOString(),
    players
  };

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(document)
  );
}