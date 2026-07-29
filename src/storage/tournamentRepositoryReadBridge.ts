import type { TournamentDocument, TournamentSummary } from './tournamentRepository';
import {
  getCurrentTournamentId as getLegacyCurrentTournamentId,
  createTournamentDocument as createLegacyTournamentDocument,
  defaultTournamentName,
  duplicateTournament as duplicateLegacyTournament,
  getTournament as getLegacyTournament,
  listTournaments as listLegacyTournaments,
saveTournament as saveLegacyTournament
} from './tournamentRepository';
import { TournamentRepositoryCore } from './tournamentRepositoryCore';

type RepositoryPointerData = {
  legacyTournamentId: string;
};

const REPOSITORY_NAMESPACE = 'bear-tracker:tournament-repository-ui-read:v1';

function nowIso(): string {
  return new Date().toISOString();
}

function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function repository(): TournamentRepositoryCore<RepositoryPointerData> {
  return new TournamentRepositoryCore<RepositoryPointerData>(
    window.localStorage,
    nowIso,
    createId,
    REPOSITORY_NAMESPACE
  );
}

/**
 * Step 3 compatibility bridge.
 *
 * The verified repository owns the visible list metadata and current-tournament
 * pointer. Tournament documents still load from the existing storage layer in
 * this read-only integration step. No tournament data is deleted or rewritten.
 */
export function initializeTournamentRepositoryReadBridge(): void {
  const repo = repository();
  const legacyTournaments = listLegacyTournaments();

  for (const tournament of legacyTournaments) {
    const existing = repo.load(tournament.id);
    const pointerData = { legacyTournamentId: tournament.id };

    if (!existing) {
      repo.create({
        id: tournament.id,
        name: tournament.name,
        tournamentDate: tournament.roundDate,
        data: pointerData
      });
      continue;
    }

    // Once a repository record exists, its name and tournament date are the
    // authoritative metadata. Do not copy legacy metadata back over it during
    // startup, because that would undo repository-backed renames. Only repair
    // the compatibility pointer if it is ever out of sync.
    if (existing.data.legacyTournamentId !== tournament.id) {
      repo.save(tournament.id, {
        name: existing.name,
        tournamentDate: existing.tournamentDate,
        data: pointerData
      });
    }
  }

  

  const currentId = repo.getCurrentId();
  if (currentId) return;

  const legacyCurrentId = getLegacyCurrentTournamentId();
  if (legacyCurrentId && repo.load(legacyCurrentId)) {
    repo.setCurrent(legacyCurrentId);
    return;
  }

  const firstAvailable = repo.list()[0];
  if (firstAvailable) repo.setCurrent(firstAvailable.id);
}

export function listRepositoryTournamentSummaries(): TournamentSummary[] {
  const repo = repository();

  return repo.list().flatMap((recordSummary) => {
    const record = repo.load(recordSummary.id);
    if (!record) return [];

    const legacy = getLegacyTournament(record.data.legacyTournamentId);
    if (!legacy) return [];

    return [{
      ...legacy,
      id: record.id,
      name: record.name,
      roundDate: record.tournamentDate,
      kind: legacy.kind,
      archived: false,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }];
  });
}

export function getRepositoryCurrentTournamentId(): string | null {
  return repository().getCurrentId();
}

export function setRepositoryCurrentTournament(id: string): void {
  repository().setCurrent(id);
}

export function getRepositoryTournamentDocument(id: string): TournamentDocument | null {
  const record = repository().load(id);
  return record ? getLegacyTournament(record.data.legacyTournamentId) : null;
}

export function getRepositoryCurrentTournamentDocument(): TournamentDocument | null {
  const id = getRepositoryCurrentTournamentId();
  return id ? getRepositoryTournamentDocument(id) : null;
}

export function renameRepositoryTournament(id: string, name: string): TournamentSummary {
  const renamed = repository().rename(id, name);
  const legacy = getLegacyTournament(renamed.data.legacyTournamentId);
  if (!legacy) {
    throw new Error('The tournament data linked to this repository entry could not be found.');
  }

  return {
    ...legacy,
    id: renamed.id,
    name: renamed.name,
    roundDate: renamed.tournamentDate,
    kind: legacy.kind,
    archived: false,
    createdAt: renamed.createdAt,
    updatedAt: renamed.updatedAt
  };
}


export function suggestedRepositoryDuplicateName(id: string): string {
  const source = repository().load(id);
  if (!source) throw new Error('Tournament not found.');

  const names = new Set(repository().list().map((item) => item.name.toLowerCase()));
  const numbered = source.name.match(/^(.*?)(?:\s+(\d+))$/);
  const baseName = numbered ? numbered[1].trim() : source.name.trim();
  let number = numbered ? Number(numbered[2]) + 1 : 2;
  let candidate = `${baseName} ${number}`;

  while (names.has(candidate.toLowerCase())) {
    number += 1;
    candidate = `${baseName} ${number}`;
  }

  return candidate;
}

export function duplicateRepositoryTournament(id: string, name?: string): TournamentSummary {
  const repo = repository();
  const source = repo.load(id);
  if (!source) throw new Error('Tournament not found.');

  const sourceLegacy = getLegacyTournament(source.data.legacyTournamentId);
  if (!sourceLegacy) {
    throw new Error('The tournament data linked to this repository entry could not be found.');
  }

  const duplicateName = name?.trim() || suggestedRepositoryDuplicateName(id);
  const legacyDuplicate = duplicateLegacyTournament(
    source.data.legacyTournamentId,
    duplicateName
  );

  const duplicate = repo.duplicate(id, {
    id: legacyDuplicate.id,
    name: duplicateName,
    data: { legacyTournamentId: legacyDuplicate.id }
  });
  repo.setCurrent(duplicate.id);

  return {
    ...legacyDuplicate,
    id: duplicate.id,
    name: duplicate.name,
    roundDate: duplicate.tournamentDate,
    kind: 'development',
    archived: false,
    createdAt: duplicate.createdAt,
    updatedAt: duplicate.updatedAt
  };
}

export function findRepositoryTournamentByDate(
  tournamentDate: string
): TournamentSummary | null {
  const normalizedDate = tournamentDate.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    return null;
  }

  const matching = listRepositoryTournamentSummaries().filter(
    (summary) => summary.roundDate === normalizedDate
  );

  if (matching.length === 0) {
    return null;
  }

  const currentId = repository().getCurrentId();

  return (
    matching.find((summary) => summary.id === currentId) ??
    matching.find((summary) => summary.kind === 'official') ??
    matching[0]
  );
}

export function createRepositoryTournamentFromPairings(
  data: import('./currentRoundStorage').SavedCurrentRound,
  tournamentDate: string
): TournamentSummary {
  const normalizedDate = tournamentDate.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw new Error('Choose a valid tournament date before applying pairings.');
  }

  const repo = repository();
  const existingForDate = repo.list().find(
    (item) => item.tournamentDate === normalizedDate
  );
  if (existingForDate) {
    throw new Error(
      `A repository tournament already exists for ${normalizedDate}. Open it before replacing its pairings.`
    );
  }

  const name = defaultTournamentName(normalizedDate);
  const legacyDocument = createLegacyTournamentDocument(data, {
    name,
    kind: 'official',
    makeCurrent: true
  });

  const created = repo.create({
    id: legacyDocument.id,
    name,
    tournamentDate: normalizedDate,
    data: { legacyTournamentId: legacyDocument.id }
  });
  repo.setCurrent(created.id);

  return {
    ...legacyDocument,
    id: created.id,
    name: created.name,
    roundDate: created.tournamentDate,
    kind: 'official',
    archived: false,
    createdAt: created.createdAt,
    updatedAt: created.updatedAt
  };
}
export function updateRepositoryTournamentFromPairings(
  repositoryId: string,
  data: import('./currentRoundStorage').SavedCurrentRound,
  tournamentDate: string
): TournamentSummary {
  const normalizedDate = tournamentDate.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedDate)) {
    throw new Error(
      'Choose a valid tournament date before applying pairings.'
    );
  }

  const repo = repository();
  const repositoryRecord = repo.load(repositoryId);

  if (!repositoryRecord) {
    throw new Error(
      'The current repository tournament could not be found.'
    );
  }

  if (repositoryRecord.tournamentDate !== normalizedDate) {
    throw new Error(
      'The imported pairings date does not match the current tournament.'
    );
  }

  const updatedLegacyDocument = saveLegacyTournament(
    repositoryRecord.data.legacyTournamentId,
    data
  );

  const updatedRepositoryRecord = repo.save(repositoryId, {
    name: repositoryRecord.name,
    tournamentDate: normalizedDate,
    data: {
      legacyTournamentId:
        repositoryRecord.data.legacyTournamentId
    }
  });

  repo.setCurrent(repositoryId);

  return {
    ...updatedLegacyDocument,
    id: updatedRepositoryRecord.id,
    name: updatedRepositoryRecord.name,
    roundDate: updatedRepositoryRecord.tournamentDate,
    kind: updatedLegacyDocument.kind,
    archived: false,
    createdAt: updatedRepositoryRecord.createdAt,
    updatedAt: updatedRepositoryRecord.updatedAt
  };
}
