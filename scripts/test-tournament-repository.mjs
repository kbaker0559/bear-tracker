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
  '2026-07-27T13:01:00.000Z'
];
const clock = () => times.shift() ?? '2026-07-27T13:02:00.000Z';
const ids = ['tournament-a'];
const createId = () => ids.shift() ?? 'unexpected-id';

const repository = new TournamentRepositoryCore(storage, clock, createId, 'test:bear-tracker');

const created = repository.create({
  name: 'July 18, 2026 Saturday Game',
  tournamentDate: '2026-07-18',
  data: { players: 23, cards: 6, status: 'ready-for-scorecards' }
});
assert.equal(created.id, 'tournament-a');
assert.equal(created.name, 'July 18, 2026 Saturday Game');
assert.equal(created.data.players, 23);

// Simulate a complete application restart by constructing a new repository
// instance over the same persisted storage.
const restartedRepository = new TournamentRepositoryCore(
  storage,
  clock,
  createId,
  'test:bear-tracker'
);

const loaded = restartedRepository.load('tournament-a');
assert.ok(loaded);
assert.deepEqual(loaded.data, {
  players: 23,
  cards: 6,
  status: 'ready-for-scorecards'
});

const listedBeforeSave = restartedRepository.list();
assert.equal(listedBeforeSave.length, 1);
assert.equal(listedBeforeSave[0].name, 'July 18, 2026 Saturday Game');

const saved = restartedRepository.save('tournament-a', {
  data: { players: 23, cards: 6, status: 'one-card-imported' }
});
assert.equal(saved.name, 'July 18, 2026 Saturday Game');
assert.equal(saved.tournamentDate, '2026-07-18');
assert.equal(saved.data.status, 'one-card-imported');
assert.equal(saved.createdAt, '2026-07-27T13:00:00.000Z');
assert.equal(saved.updatedAt, '2026-07-27T13:01:00.000Z');

const listedAfterSave = restartedRepository.list();
assert.equal(listedAfterSave.length, 1);
assert.equal(listedAfterSave[0].updatedAt, '2026-07-27T13:01:00.000Z');

const reloaded = restartedRepository.load('tournament-a');
assert.equal(reloaded?.data.status, 'one-card-imported');

console.log('PASS Tournament Repository Core Step 1');
console.log('  ✓ create tournament');
console.log('  ✓ persist tournament document');
console.log('  ✓ load after repository restart');
console.log('  ✓ list tournament summaries');
console.log('  ✓ save without changing identity, name, or date');
