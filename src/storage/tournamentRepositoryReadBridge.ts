import type { TournamentDocument, TournamentSummary } from './tournamentRepository';
import {
  getCurrentTournamentId as getLegacyCurrentTournamentId,
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

    if (
      existing.name !== tournament.name ||
      existing.tournamentDate !== tournament.roundDate ||
      existing.data.legacyTournamentId !== tournament.id
    ) {
      repo.save(tournament.id, {
        name: tournament.name,
        tournamentDate: tournament.roundDate,
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
