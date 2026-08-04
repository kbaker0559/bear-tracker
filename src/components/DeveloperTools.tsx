import { resetBearTrackerStorage } from '../storage/developerTools';
import { useMemo } from 'react';
import type { BenchmarkSummary } from '../types/benchmark';
import type { LeaguePlayer } from '../types/leaguePlayer';
import IdentityEngineTest from './IdentityEngineTest';

type Props = {
  benchmarks: BenchmarkSummary[];

  onCreateBenchmark: () => void;

  leaguePlayers: LeaguePlayer[];

  onLoadBenchmark: (
    benchmarkId: string
  ) => void;

  onDeleteBenchmark: (
    benchmarkId: string
  ) => void;

  onResetOcrTestData: () => void;
  autosaveStatus: string;
};

export default function DeveloperTools({
  benchmarks,
  leaguePlayers,
  onCreateBenchmark,
  onLoadBenchmark,
  onDeleteBenchmark,
  onResetOcrTestData,
  autosaveStatus
}: Props) {
  const hasBenchmarks = useMemo(
    () => benchmarks.length > 0,
    [benchmarks]
  );

  function resetAllBearTrackerData() {
  const confirmed = window.confirm(
    'This will delete every Bear Tracker tournament and all saved Bear Tracker data from this browser. Continue?'
  );

  if (!confirmed) {
    return;
  }

  const confirmedAgain = window.confirm(
    'Final warning: this cannot be undone unless you restore your downloaded backup. Delete everything?'
  );

  if (!confirmedAgain) {
    return;
  }

  resetBearTrackerStorage();
}

  return (
    <section className="card">
      <h2>Developer Tools</h2>


      <div className="developer-autosave-status">
        <strong>Session recovery:</strong> {autosaveStatus}
      </div>

      <IdentityEngineTest players={leaguePlayers} />

      <button
        type="button"
        onClick={onResetOcrTestData}
        style={{ marginTop: '0.75rem' }}
      >
        Reset OCR Test Data
      </button>

      <p style={{ fontSize: '0.9rem', opacity: 0.75 }}>
        Clears scorecard photos, recognition results, validation decisions, and review corrections. Pairings, cards, handicaps, quotas, arrivals, and payments are preserved.
      </p>

      <button
        type="button"
        onClick={onCreateBenchmark}
      >
        Create Benchmark from Current Round
      </button>

      <hr
        style={{
          margin: '1.5rem 0'
        }}
      />

      <h3>Saved Benchmarks</h3>

      {!hasBenchmarks && (
        <p>No benchmarks have been saved.</p>
      )}

      {benchmarks.map((benchmark) => (
        <div
          key={benchmark.id}
          className="score-row"
          style={{
            marginBottom: '1rem'
          }}
        >
          <div>
            <strong>
              {benchmark.name}
            </strong>

            <div>
              {benchmark.description}
            </div>

            <div
              style={{
                fontSize: '0.9rem',
                opacity: 0.7
              }}
            >
              Version {benchmark.version}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <button
              type="button"
              onClick={() =>
                onLoadBenchmark(
                  benchmark.id
                )
              }
            >
              Load
            </button>

            <button
              type="button"
              onClick={() =>
                onDeleteBenchmark(
                  benchmark.id
                )
              }
            >
              Delete
            </button>
          </div>
        </div>
      ))}
            <hr
        style={{
          margin: '1.5rem 0'
        }}
      />

      <h3>Development Storage Reset</h3>

      <p style={{ fontSize: '0.9rem', opacity: 0.75 }}>
        Deletes every Bear Tracker tournament and all saved Bear Tracker data
        from this browser. Make sure you've exported a backup first.
      </p>

      <button
        type="button"
        onClick={resetAllBearTrackerData}
      >
        Reset Bear Tracker Storage
      </button>
    </section>
  );
}