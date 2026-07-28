import assert from 'node:assert/strict';
import { TournamentRepositoryCore } from '../.repository-test-build/tournamentRepositoryCore.js';

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

const storage = new MemoryStorage();
const times = [
  '2026-07-27T13:00:00.000Z',
  '2026-07-27T13:01:00.000Z',
  '2026-07-27T13:02:00.000Z'
];
const clock = () => times.shift() ?? '2026-07-27T13:03:00.000Z';
const ids = ['tournament-a', 'tournament-b', 'tournament-b-copy'];
const createId = () => ids.shift() ?? 'unexpected-id';
const namespace = 'test:bear-tracker';

const repository = new TournamentRepositoryCore(storage, clock, createId, namespace);

const tournamentA = repository.create({
  name: 'July 18, 2026 Saturday Game',
  tournamentDate: '2026-07-18',
  data: { players: 23, cards: 6, status: 'ready-for-scorecards' }
});
assert.equal(tournamentA.id, 'tournament-a');
assert.equal(tournamentA.name, 'July 18, 2026 Saturday Game');
assert.equal(tournamentA.data.players, 23);

const tournamentB = repository.create({
  name: 'July 4, 2026 Saturday Game',
  tournamentDate: '2026-07-04',
  data: { players: 25, cards: 7, status: 'complete' }
});
assert.equal(tournamentB.id, 'tournament-b');

repository.setCurrent('tournament-a');
assert.equal(repository.getCurrentId(), 'tournament-a');
assert.equal(repository.getCurrent()?.name, 'July 18, 2026 Saturday Game');

// Simulate a complete application restart over the same persisted storage.
const firstRestart = new TournamentRepositoryCore(storage, clock, createId, namespace);
assert.equal(firstRestart.getCurrentId(), 'tournament-a');
assert.equal(firstRestart.getCurrent()?.data.status, 'ready-for-scorecards');

firstRestart.setCurrent('tournament-b');
assert.equal(firstRestart.getCurrentId(), 'tournament-b');

// Simulate a second restart after switching tournaments.
const secondRestart = new TournamentRepositoryCore(storage, clock, createId, namespace);
assert.equal(secondRestart.getCurrentId(), 'tournament-b');
assert.equal(secondRestart.getCurrent()?.name, 'July 4, 2026 Saturday Game');

const renamed = secondRestart.rename('tournament-b', 'July 4 OCR Test');
assert.equal(renamed.id, 'tournament-b');
assert.equal(renamed.name, 'July 4 OCR Test');
assert.equal(renamed.tournamentDate, '2026-07-04');
assert.equal(renamed.data.status, 'complete');

const renameRestart = new TournamentRepositoryCore(storage, clock, createId, namespace);
assert.equal(renameRestart.getCurrentId(), 'tournament-b');
assert.equal(renameRestart.getCurrent()?.name, 'July 4 OCR Test');
assert.equal(renameRestart.getCurrent()?.data.status, 'complete');


const duplicated = renameRestart.duplicate('tournament-b', {
  name: 'July 4 OCR Test 2'
});
assert.equal(duplicated.id, 'tournament-b-copy');
assert.equal(duplicated.name, 'July 4 OCR Test 2');
assert.equal(duplicated.tournamentDate, '2026-07-04');
assert.equal(duplicated.sourceTournamentId, 'tournament-b');
assert.deepEqual(duplicated.data, renamed.data);
assert.notStrictEqual(duplicated.data, renamed.data);

renameRestart.setCurrent(duplicated.id);
const duplicateRestart = new TournamentRepositoryCore(storage, clock, createId, namespace);
assert.equal(duplicateRestart.getCurrentId(), 'tournament-b-copy');
assert.equal(duplicateRestart.getCurrent()?.name, 'July 4 OCR Test 2');
assert.equal(duplicateRestart.load('tournament-b')?.name, 'July 4 OCR Test');

const changedCopy = duplicateRestart.save('tournament-b-copy', {
  data: { players: 99, cards: 8, status: 'duplicate-edited' }
});
assert.equal(changedCopy.data.players, 99);
assert.equal(duplicateRestart.load('tournament-b')?.data.players, 25);

const listed = renameRestart.list();
assert.equal(listed.length, 3);
assert.deepEqual(
  new Set(listed.map((item) => item.id)),
  new Set(['tournament-a', 'tournament-b', 'tournament-b-copy'])
);

const saved = renameRestart.save('tournament-a', {
  data: { players: 23, cards: 6, status: 'one-card-imported' }
});
assert.equal(saved.name, 'July 18, 2026 Saturday Game');
assert.equal(saved.tournamentDate, '2026-07-18');
assert.equal(saved.data.status, 'one-card-imported');

assert.throws(
  () => renameRestart.setCurrent('missing-tournament'),
  /does not exist/
);
assert.equal(renameRestart.getCurrentId(), 'tournament-b-copy');

console.log('PASS Tournament Repository AT-34.2');
console.log('  ✓ create, persist, load, and list tournament documents');
console.log('  ✓ set Tournament A as current');
console.log('  ✓ restore Tournament A after repository restart');
console.log('  ✓ switch current pointer to Tournament B');
console.log('  ✓ restore Tournament B after second restart');
console.log('  ✓ rename Tournament B without changing identity, date, or contents');
console.log('  ✓ preserve renamed tournament after repository restart');
console.log('  ✓ duplicate with a new permanent ID and source tournament reference');
console.log('  ✓ preserve original and duplicate independently after restart');
console.log('  ✓ editing the duplicate does not change the original');
console.log('  ✓ reject a pointer to a missing tournament');
console.log('  ✓ preserve tournament identity, name, and date when saving');
