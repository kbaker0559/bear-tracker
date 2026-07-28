import type { SavedCurrentRound } from './currentRoundStorage';

const LIBRARY_KEY = 'glos-tournament-library-v1';
const ACTIVE_KEY = 'glos-active-tournament-id-v1';
const LEGACY_KEY = 'glos-current-round';

type TournamentStatus = 'active' | 'completed' | 'archived' | 'development';

export type TournamentDocument = {
  id: string;
  name: string;
  roundDate: string;
  status: TournamentStatus;
  official: boolean;
  createdAt: string;
  updatedAt: string;
  lastOpenedAt: string;
  data: SavedCurrentRound;
};

export type TournamentSummary = Omit<TournamentDocument, 'data'> & {
  playerCount: number;
  cardCount: number;
};

function safeData(value: SavedCurrentRound): SavedCurrentRound {
  return {
    ...value,
    roundBundle: {
      ...value.roundBundle,
      scorecardImports: value.roundBundle.scorecardImports.map((item) => ({
        ...item,
        imageUrl: undefined,
        originalImageUrl: undefined
      }))
    }
  };
}

function readLibrary(): TournamentDocument[] {
  try {
    const raw = window.localStorage.getItem(LIBRARY_KEY);
    return raw ? (JSON.parse(raw) as TournamentDocument[]) : [];
  } catch (error) {
    console.error('Could not read the tournament library.', error);
    return [];
  }
}

function writeLibrary(documents: TournamentDocument[]): void {
  window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(documents));
}

function displayName(date: string): string {
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? `${date} Saturday Game`
    : `${parsed.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} Saturday Game`;
}

function makeUniqueId(date: string, documents: TournamentDocument[]): string {
  const base = `tournament-${date}`;
  if (!documents.some((item) => item.id === base)) return base;
  let suffix = 2;
  while (documents.some((item) => item.id === `${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

export function ensureTournamentLibrary(): TournamentDocument[] {
  let documents = readLibrary();
  if (documents.length > 0) return documents;

  const legacyRaw = window.localStorage.getItem(LEGACY_KEY);
  if (!legacyRaw) return documents;

  try {
    const legacy = JSON.parse(legacyRaw) as SavedCurrentRound;
    const now = new Date().toISOString();
    const date = legacy.roundBundle.round.date;
    const document: TournamentDocument = {
      id: makeUniqueId(date, []),
      name: displayName(date),
      roundDate: date,
      status: legacy.roundBundle.round.finalizedAt ? 'completed' : 'active',
      official: true,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
      data: safeData(legacy)
    };
    documents = [document];
    writeLibrary(documents);
    window.localStorage.setItem(ACTIVE_KEY, document.id);
    return documents;
  } catch (error) {
    console.error('Could not migrate the previous saved round.', error);
    return [];
  }
}

export function listTournaments(): TournamentSummary[] {
  return ensureTournamentLibrary()
    .map(({ data, ...document }) => ({
      ...document,
      playerCount: data.roundBundle.roundPlayers.length,
      cardCount: data.roundBundle.scorecards.length
    }))
    .sort((a, b) => b.lastOpenedAt.localeCompare(a.lastOpenedAt));
}

export function getActiveTournament(): TournamentDocument | null {
  const documents = ensureTournamentLibrary();
  if (documents.length === 0) return null;
  const activeId = window.localStorage.getItem(ACTIVE_KEY);
  return documents.find((item) => item.id === activeId) ?? documents[0];
}

export function openTournament(id: string): TournamentDocument | null {
  const documents = ensureTournamentLibrary();
  const index = documents.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const now = new Date().toISOString();
  documents[index] = { ...documents[index], lastOpenedAt: now };
  writeLibrary(documents);
  window.localStorage.setItem(ACTIVE_KEY, id);
  return documents[index];
}

export function saveActiveTournament(data: SavedCurrentRound): string {
  const documents = ensureTournamentLibrary();
  const activeId = window.localStorage.getItem(ACTIVE_KEY);
  const now = new Date().toISOString();
  const roundDate = data.roundBundle.round.date;
  const index = documents.findIndex((item) => item.id === activeId);

  if (index >= 0) {
    documents[index] = {
      ...documents[index],
      roundDate,
      status: data.roundBundle.round.finalizedAt ? 'completed' : documents[index].status,
      updatedAt: now,
      data: safeData(data)
    };
    writeLibrary(documents);
    return now;
  }

  const id = makeUniqueId(roundDate, documents);
  documents.push({
    id,
    name: displayName(roundDate),
    roundDate,
    status: data.roundBundle.round.finalizedAt ? 'completed' : 'active',
    official: true,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    data: safeData(data)
  });
  writeLibrary(documents);
  window.localStorage.setItem(ACTIVE_KEY, id);
  return now;
}

export function createTournament(data: SavedCurrentRound, name?: string): TournamentDocument {
  const documents = ensureTournamentLibrary();
  const now = new Date().toISOString();
  const date = data.roundBundle.round.date;
  const document: TournamentDocument = {
    id: makeUniqueId(date, documents),
    name: name?.trim() || displayName(date),
    roundDate: date,
    status: 'active',
    official: true,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    data: safeData(data)
  };
  documents.push(document);
  writeLibrary(documents);
  window.localStorage.setItem(ACTIVE_KEY, document.id);
  return document;
}

export function duplicateTournament(id: string, name: string): TournamentDocument | null {
  const documents = ensureTournamentLibrary();
  const source = documents.find((item) => item.id === id);
  if (!source) return null;
  const now = new Date().toISOString();
  const copy: TournamentDocument = {
    ...source,
    id: makeUniqueId(source.roundDate, documents),
    name: name.trim() || `${source.name} Copy`,
    status: 'development',
    official: false,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
    data: JSON.parse(JSON.stringify(source.data)) as SavedCurrentRound
  };
  documents.push(copy);
  writeLibrary(documents);
  window.localStorage.setItem(ACTIVE_KEY, copy.id);
  return copy;
}

export function renameTournament(id: string, name: string): void {
  const documents = ensureTournamentLibrary().map((item) =>
    item.id === id ? { ...item, name: name.trim() || item.name, updatedAt: new Date().toISOString() } : item
  );
  writeLibrary(documents);
}

export function setTournamentArchived(id: string, archived: boolean): void {
  const documents = ensureTournamentLibrary().map((item) =>
    item.id === id ? { ...item, status: archived ? 'archived' : 'active', updatedAt: new Date().toISOString() } : item
  );
  writeLibrary(documents);
}

export function deleteTournament(id: string): string | null {
  let documents = ensureTournamentLibrary();
  documents = documents.filter((item) => item.id !== id);
  writeLibrary(documents);
  const activeId = window.localStorage.getItem(ACTIVE_KEY);
  if (activeId !== id) return activeId;
  const nextId = documents[0]?.id ?? null;
  if (nextId) window.localStorage.setItem(ACTIVE_KEY, nextId);
  else window.localStorage.removeItem(ACTIVE_KEY);
  return nextId;
}
