import type { RoundBundle } from '../engine/roundEngine';
import type { Group, Player } from '../types';
import type { PlayerAccount } from '../types/playerAccount';
import { loadCurrentRound, type SavedCurrentRound } from './currentRoundStorage';

const INDEX_KEY = 'bear-tracker:tournament-library:index:v1';
const CURRENT_ID_KEY = 'bear-tracker:tournament-library:current-id:v1';
const DOCUMENT_PREFIX = 'bear-tracker:tournament-library:document:v1:';
const OLD_LIBRARY_KEY = 'glos-tournament-library-v1';
const OLD_ACTIVE_KEY = 'glos-active-tournament-id-v1';

export type TournamentKind = 'official' | 'development';

export type TournamentSummary = {
  id: string;
  name: string;
  roundDate: string;
  kind: TournamentKind;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
  playerCount: number;
  cardCount: number;
};

export type TournamentDocument = TournamentSummary & {
  data: SavedCurrentRound;
};

type TournamentIndex = {
  version: 1;
  tournaments: TournamentSummary[];
};

function nowIso(): string {
  return new Date().toISOString();
}

function uniqueId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function dateLabel(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

export function defaultTournamentName(date: string): string {
  return `${dateLabel(date)} Saturday Game`;
}

function sanitizeData(data: SavedCurrentRound): SavedCurrentRound {
  return {
    ...data,
    roundBundle: {
      ...data.roundBundle,
      scorecardImports: data.roundBundle.scorecardImports.map((item) => ({
        ...item,
        imageUrl: undefined,
        originalImageUrl: undefined
      }))
    }
  };
}

function summaryFromDocument(document: TournamentDocument): TournamentSummary {
  const { data: _data, ...summary } = document;
  return summary;
}

function readIndex(): TournamentIndex {
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return { version: 1, tournaments: [] };
    const parsed = JSON.parse(raw) as TournamentIndex;
    return {
      version: 1,
      tournaments: Array.isArray(parsed.tournaments) ? parsed.tournaments : []
    };
  } catch (error) {
    console.error('Could not read the tournament library index.', error);
    return { version: 1, tournaments: [] };
  }
}

function writeIndex(index: TournamentIndex): void {
  window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

function writeDocument(document: TournamentDocument): void {
  window.localStorage.setItem(
    `${DOCUMENT_PREFIX}${document.id}`,
    JSON.stringify({ ...document, data: sanitizeData(document.data) })
  );
}

function upsertSummary(summary: TournamentSummary): void {
  const index = readIndex();
  const next = [
    summary,
    ...index.tournaments.filter((item) => item.id !== summary.id)
  ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  writeIndex({ version: 1, tournaments: next });
}

export function listTournaments(): TournamentSummary[] {
  return readIndex().tournaments;
}

export function getCurrentTournamentId(): string | null {
  return window.localStorage.getItem(CURRENT_ID_KEY);
}

export function setCurrentTournamentId(id: string): void {
  window.localStorage.setItem(CURRENT_ID_KEY, id);
}

export function getTournament(id: string): TournamentDocument | null {
  try {
    const raw = window.localStorage.getItem(`${DOCUMENT_PREFIX}${id}`);
    return raw ? (JSON.parse(raw) as TournamentDocument) : null;
  } catch (error) {
    console.error(`Could not load tournament ${id}.`, error);
    return null;
  }
}

export function createTournamentDocument(
  data: SavedCurrentRound,
  options: {
    name?: string;
    kind?: TournamentKind;
    archived?: boolean;
    makeCurrent?: boolean;
  } = {}
): TournamentDocument {
  const timestamp = nowIso();
  const id = uniqueId();
  const roundDate = data.roundBundle.round.date;
  const document: TournamentDocument = {
    id,
    name: options.name?.trim() || defaultTournamentName(roundDate),
    roundDate,
    kind: options.kind ?? 'official',
    archived: options.archived ?? false,
    createdAt: timestamp,
    updatedAt: timestamp,
    playerCount: data.roundBundle.roundPlayers.length,
    cardCount: data.roundBundle.scorecards.length,
    data: sanitizeData(data)
  };
  writeDocument(document);
  upsertSummary(summaryFromDocument(document));
  if (options.makeCurrent !== false) setCurrentTournamentId(id);
  return document;
}

export function saveTournament(
  id: string,
  data: SavedCurrentRound
): TournamentDocument {
  const existing = getTournament(id);
  if (!existing) {
    throw new Error('The selected tournament no longer exists in storage.');
  }
  const updated: TournamentDocument = {
    ...existing,
    roundDate: data.roundBundle.round.date,
    updatedAt: nowIso(),
    playerCount: data.roundBundle.roundPlayers.length,
    cardCount: data.roundBundle.scorecards.length,
    data: sanitizeData(data)
  };
  writeDocument(updated);
  upsertSummary(summaryFromDocument(updated));
  return updated;
}

export function renameTournament(id: string, name: string): TournamentDocument {
  const existing = getTournament(id);
  if (!existing) throw new Error('Tournament not found.');
  const updated = { ...existing, name: name.trim(), updatedAt: nowIso() };
  writeDocument(updated);
  upsertSummary(summaryFromDocument(updated));
  return updated;
}

export function setTournamentArchived(id: string, archived: boolean): TournamentDocument {
  const existing = getTournament(id);
  if (!existing) throw new Error('Tournament not found.');
  const updated = { ...existing, archived, updatedAt: nowIso() };
  writeDocument(updated);
  upsertSummary(summaryFromDocument(updated));
  return updated;
}

export function duplicateTournament(id: string, name?: string): TournamentDocument {
  const existing = getTournament(id);
  if (!existing) throw new Error('Tournament not found.');
  return createTournamentDocument(existing.data, {
    name: name?.trim() || `${existing.name} OCR Test`,
    kind: 'development',
    makeCurrent: true
  });
}

export function deleteTournament(id: string): string | null {
  window.localStorage.removeItem(`${DOCUMENT_PREFIX}${id}`);
  const index = readIndex();
  const remaining = index.tournaments.filter((item) => item.id !== id);
  writeIndex({ version: 1, tournaments: remaining });
  const currentId = getCurrentTournamentId();
  if (currentId !== id) return currentId;
  const nextId = remaining.find((item) => !item.archived)?.id ?? remaining[0]?.id ?? null;
  if (nextId) setCurrentTournamentId(nextId);
  else window.localStorage.removeItem(CURRENT_ID_KEY);
  return nextId;
}


type LegacyTournamentDocument = {
  id: string;
  name: string;
  roundDate: string;
  status: 'active' | 'completed' | 'archived' | 'development';
  official: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  data: SavedCurrentRound;
};

function migratePreviousTournamentLibrary(): TournamentDocument[] {
  try {
    const raw = window.localStorage.getItem(OLD_LIBRARY_KEY);
    if (!raw) return [];
    const legacy = JSON.parse(raw) as LegacyTournamentDocument[];
    if (!Array.isArray(legacy) || legacy.length === 0) return [];

    const idMap = new Map<string, string>();
    const migrated = legacy.map((item) => {
      const id = uniqueId();
      idMap.set(item.id, id);
      const document: TournamentDocument = {
        id,
        name: item.name || defaultTournamentName(item.roundDate),
        roundDate: item.roundDate || item.data.roundBundle.round.date,
        kind: item.status === 'development' || !item.official ? 'development' : 'official',
        archived: item.status === 'archived',
        createdAt: item.createdAt || nowIso(),
        updatedAt: item.updatedAt || item.lastOpenedAt || nowIso(),
        playerCount: item.data.roundBundle.roundPlayers.length,
        cardCount: item.data.roundBundle.scorecards.length,
        data: sanitizeData(item.data)
      };
      writeDocument(document);
      return document;
    });

    writeIndex({
      version: 1,
      tournaments: migrated.map(summaryFromDocument).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    });

    const oldActiveId = window.localStorage.getItem(OLD_ACTIVE_KEY);
    const mappedActiveId = oldActiveId ? idMap.get(oldActiveId) : undefined;
    const activeId = mappedActiveId ?? migrated[0]?.id;
    if (activeId) setCurrentTournamentId(activeId);
    return migrated;
  } catch (error) {
    console.error('Could not migrate the previous tournament library.', error);
    return [];
  }
}

export function initializeTournamentRepository(
  createInitialData: () => SavedCurrentRound
): TournamentDocument {
  let summaries = listTournaments();

  if (summaries.length === 0) {
    const previousLibrary = migratePreviousTournamentLibrary();
    if (previousLibrary.length > 0) {
      summaries = listTournaments();
    }
  }

  if (summaries.length === 0) {
  const legacy = loadCurrentRound();

  if (legacy) {
    return createTournamentDocument(legacy, {
      name: defaultTournamentName(
        legacy.roundBundle.round.date
      ),
      makeCurrent: true
    });
  }

  return {
    id: '',
    name: '',
    roundDate: '',
    kind: 'development',
    archived: false,
    createdAt: '',
    updatedAt: '',
    playerCount: 0,
    cardCount: 0,
    data: createInitialData()
  };
}

  const currentId = getCurrentTournamentId();
  if (currentId) {
    const current = getTournament(currentId);
    if (current) return current;
  }

  summaries = listTournaments();
  const fallback = summaries.find((item) => !item.archived) ?? summaries[0];
  const document = fallback ? getTournament(fallback.id) : null;
  if (document) {
    setCurrentTournamentId(document.id);
    return document;
  }

  return {
  id: '',
  name: '',
  roundDate: '',
  kind: 'development',
  archived: false,
  createdAt: '',
  updatedAt: '',
  playerCount: 0,
  cardCount: 0,
  data: createInitialData()
};
}

export function replaceTournamentDocument(document: TournamentDocument): void {
  writeDocument(document);
  upsertSummary(summaryFromDocument(document));
}

export type { SavedCurrentRound, RoundBundle, Group, Player, PlayerAccount };
