import type { TournamentDocument, TournamentSummary } from './tournamentRepository';
import {
  getCurrentTournamentId as getLegacyCurrentTournamentId,
  duplicateTournament as duplicateLegacyTournament,
  getTournament as getLegacyTournament,
  listTournaments as listLegacyTournaments
} from './tournamentRepository';
import { TournamentRepositoryCore } from './tournamentRepositoryCore';

type RepositoryPointerData = {
  legacyTournamentId: string;
};

const REPOSITORY_NAMESPACE = 'bear-tracker:tournament-repository-ui-read:v1';
const STEP_3_TEST_TOURNAMENT_ID = 'repository-step-3-test-b';

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

  // Step 3 needs two visible repository entries so the current-pointer UI can
  // be tested before duplicate/write integration exists. The temporary B entry
  // safely points to the same read-only legacy document as the first entry.
  const repositoryRecords = repo.list();
  if (
    repositoryRecords.length === 1 &&
    !repo.load(STEP_3_TEST_TOURNAMENT_ID)
  ) {
    const source = repo.load(repositoryRecords[0].id);
    if (source) {
      repo.create({
        id: STEP_3_TEST_TOURNAMENT_ID,
        name: `${source.name} — Repository Test B`,
        tournamentDate: source.tournamentDate,
        data: { legacyTournamentId: source.data.legacyTournamentId }
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
      kind: record.id === STEP_3_TEST_TOURNAMENT_ID ? 'development' : legacy.kind,
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
    kind: renamed.id === STEP_3_TEST_TOURNAMENT_ID ? 'development' : legacy.kind,
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
