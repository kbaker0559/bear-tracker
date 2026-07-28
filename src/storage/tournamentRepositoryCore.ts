export type RepositoryStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export type RepositoryClock = () => string;
export type RepositoryIdFactory = () => string;

export type TournamentRecord<TData> = {
  schemaVersion: 1;
  id: string;
  name: string;
  tournamentDate: string;
  createdAt: string;
  updatedAt: string;
  data: TData;
};

export type TournamentRecordSummary = Omit<TournamentRecord<never>, 'data'>;

type TournamentIndex = {
  schemaVersion: 1;
  tournaments: TournamentRecordSummary[];
};

export type CreateTournamentInput<TData> = {
  name: string;
  tournamentDate: string;
  data: TData;
  id?: string;
};

export type SaveTournamentInput<TData> = {
  name?: string;
  tournamentDate?: string;
  data: TData;
};

const DEFAULT_NAMESPACE = 'bear-tracker:repository-core:v1';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class TournamentRepositoryCore<TData> {
  private readonly indexKey: string;
  private readonly documentPrefix: string;
  private readonly currentIdKey: string;

  constructor(
    private readonly storage: RepositoryStorage,
    private readonly clock: RepositoryClock,
    private readonly createId: RepositoryIdFactory,
    namespace = DEFAULT_NAMESPACE
  ) {
    this.indexKey = `${namespace}:index`;
    this.documentPrefix = `${namespace}:document:`;
    this.currentIdKey = `${namespace}:current-id`;
  }

  create(input: CreateTournamentInput<TData>): TournamentRecord<TData> {
    const id = input.id?.trim() || this.createId();
    if (!id) throw new Error('Tournament ID cannot be empty.');
    if (this.load(id)) throw new Error(`Tournament ${id} already exists.`);

    const timestamp = this.clock();
    const record: TournamentRecord<TData> = {
      schemaVersion: 1,
      id,
      name: this.requireText(input.name, 'Tournament name'),
      tournamentDate: this.requireText(input.tournamentDate, 'Tournament date'),
      createdAt: timestamp,
      updatedAt: timestamp,
      data: clone(input.data)
    };

    this.writeRecord(record);
    this.upsertSummary(record);
    return clone(record);
  }

  save(id: string, input: SaveTournamentInput<TData>): TournamentRecord<TData> {
    const existing = this.load(id);
    if (!existing) throw new Error(`Tournament ${id} does not exist.`);

    const updated: TournamentRecord<TData> = {
      ...existing,
      name: input.name === undefined
        ? existing.name
        : this.requireText(input.name, 'Tournament name'),
      tournamentDate: input.tournamentDate === undefined
        ? existing.tournamentDate
        : this.requireText(input.tournamentDate, 'Tournament date'),
      updatedAt: this.clock(),
      data: clone(input.data)
    };

    this.writeRecord(updated);
    this.upsertSummary(updated);
    return clone(updated);
  }

  load(id: string): TournamentRecord<TData> | null {
    const raw = this.storage.getItem(this.documentKey(id));
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as TournamentRecord<TData>;
      if (parsed.schemaVersion !== 1 || parsed.id !== id) {
        throw new Error('Stored tournament identity or schema is invalid.');
      }
      return clone(parsed);
    } catch (error) {
      throw new Error(`Tournament ${id} could not be loaded.`, { cause: error });
    }
  }

  list(): TournamentRecordSummary[] {
    const index = this.readIndex();
    return clone(
      [...index.tournaments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    );
  }

  setCurrent(id: string): TournamentRecord<TData> {
    const normalizedId = id.trim();
    if (!normalizedId) throw new Error('Current tournament ID cannot be empty.');

    const tournament = this.load(normalizedId);
    if (!tournament) {
      throw new Error(`Tournament ${normalizedId} does not exist.`);
    }

    this.storage.setItem(this.currentIdKey, normalizedId);
    return tournament;
  }

  getCurrentId(): string | null {
    const storedId = this.storage.getItem(this.currentIdKey)?.trim();
    if (!storedId) return null;

    // A stale pointer must never cause Bear Tracker to invent or open a
    // different tournament. Clear it and return null so the caller can ask
    // the user which tournament to open.
    if (!this.load(storedId)) {
      this.storage.removeItem(this.currentIdKey);
      return null;
    }

    return storedId;
  }

  getCurrent(): TournamentRecord<TData> | null {
    const currentId = this.getCurrentId();
    return currentId ? this.load(currentId) : null;
  }

  private requireText(value: string, label: string): string {
    const trimmed = value.trim();
    if (!trimmed) throw new Error(`${label} cannot be empty.`);
    return trimmed;
  }

  private documentKey(id: string): string {
    return `${this.documentPrefix}${id}`;
  }

  private readIndex(): TournamentIndex {
    const raw = this.storage.getItem(this.indexKey);
    if (!raw) return { schemaVersion: 1, tournaments: [] };

    try {
      const parsed = JSON.parse(raw) as TournamentIndex;
      if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.tournaments)) {
        throw new Error('Repository index schema is invalid.');
      }
      return parsed;
    } catch (error) {
      throw new Error('Tournament repository index could not be loaded.', { cause: error });
    }
  }

  private writeIndex(index: TournamentIndex): void {
    this.storage.setItem(this.indexKey, JSON.stringify(index));
  }

  private writeRecord(record: TournamentRecord<TData>): void {
    this.storage.setItem(this.documentKey(record.id), JSON.stringify(record));
  }

  private upsertSummary(record: TournamentRecord<TData>): void {
    const { data: _data, ...summary } = record;
    const index = this.readIndex();
    const tournaments = [
      summary,
      ...index.tournaments.filter((item) => item.id !== record.id)
    ];
    this.writeIndex({ schemaVersion: 1, tournaments });
  }
}
