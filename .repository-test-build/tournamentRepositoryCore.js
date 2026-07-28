const DEFAULT_NAMESPACE = 'bear-tracker:repository-core:v1';
function clone(value) {
    return JSON.parse(JSON.stringify(value));
}
export class TournamentRepositoryCore {
    storage;
    clock;
    createId;
    indexKey;
    documentPrefix;
    currentIdKey;
    constructor(storage, clock, createId, namespace = DEFAULT_NAMESPACE) {
        this.storage = storage;
        this.clock = clock;
        this.createId = createId;
        this.indexKey = `${namespace}:index`;
        this.documentPrefix = `${namespace}:document:`;
        this.currentIdKey = `${namespace}:current-id`;
    }
    create(input) {
        const id = input.id?.trim() || this.createId();
        if (!id)
            throw new Error('Tournament ID cannot be empty.');
        if (this.load(id))
            throw new Error(`Tournament ${id} already exists.`);
        const timestamp = this.clock();
        const record = {
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
    save(id, input) {
        const existing = this.load(id);
        if (!existing)
            throw new Error(`Tournament ${id} does not exist.`);
        const updated = {
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
    load(id) {
        const raw = this.storage.getItem(this.documentKey(id));
        if (!raw)
            return null;
        try {
            const parsed = JSON.parse(raw);
            if (parsed.schemaVersion !== 1 || parsed.id !== id) {
                throw new Error('Stored tournament identity or schema is invalid.');
            }
            return clone(parsed);
        }
        catch (error) {
            throw new Error(`Tournament ${id} could not be loaded.`, { cause: error });
        }
    }
    list() {
        const index = this.readIndex();
        return clone([...index.tournaments].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    }
    setCurrent(id) {
        const normalizedId = id.trim();
        if (!normalizedId)
            throw new Error('Current tournament ID cannot be empty.');
        const tournament = this.load(normalizedId);
        if (!tournament) {
            throw new Error(`Tournament ${normalizedId} does not exist.`);
        }
        this.storage.setItem(this.currentIdKey, normalizedId);
        return tournament;
    }
    getCurrentId() {
        const storedId = this.storage.getItem(this.currentIdKey)?.trim();
        if (!storedId)
            return null;
        // A stale pointer must never cause Bear Tracker to invent or open a
        // different tournament. Clear it and return null so the caller can ask
        // the user which tournament to open.
        if (!this.load(storedId)) {
            this.storage.removeItem(this.currentIdKey);
            return null;
        }
        return storedId;
    }
    getCurrent() {
        const currentId = this.getCurrentId();
        return currentId ? this.load(currentId) : null;
    }
    rename(id, name) {
        const existing = this.load(id);
        if (!existing)
            throw new Error(`Tournament ${id} does not exist.`);
        return this.save(id, {
            name: this.requireText(name, 'Tournament name'),
            data: existing.data
        });
    }
    requireText(value, label) {
        const trimmed = value.trim();
        if (!trimmed)
            throw new Error(`${label} cannot be empty.`);
        return trimmed;
    }
    documentKey(id) {
        return `${this.documentPrefix}${id}`;
    }
    readIndex() {
        const raw = this.storage.getItem(this.indexKey);
        if (!raw)
            return { schemaVersion: 1, tournaments: [] };
        try {
            const parsed = JSON.parse(raw);
            if (parsed.schemaVersion !== 1 || !Array.isArray(parsed.tournaments)) {
                throw new Error('Repository index schema is invalid.');
            }
            return parsed;
        }
        catch (error) {
            throw new Error('Tournament repository index could not be loaded.', { cause: error });
        }
    }
    writeIndex(index) {
        this.storage.setItem(this.indexKey, JSON.stringify(index));
    }
    writeRecord(record) {
        this.storage.setItem(this.documentKey(record.id), JSON.stringify(record));
    }
    upsertSummary(record) {
        const { data: _data, ...summary } = record;
        const index = this.readIndex();
        const tournaments = [
            summary,
            ...index.tournaments.filter((item) => item.id !== record.id)
        ];
        this.writeIndex({ schemaVersion: 1, tournaments });
    }
}
