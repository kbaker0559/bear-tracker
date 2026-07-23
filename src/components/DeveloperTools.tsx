import { useMemo } from 'react';
import type { BenchmarkSummary } from '../types/benchmark';

type Props = {
  benchmarks: BenchmarkSummary[];

  onCreateBenchmark: () => void;

  onLoadBenchmark: (
    benchmarkId: string
  ) => void;

  onDeleteBenchmark: (
    benchmarkId: string
  ) => void;
};

export default function DeveloperTools({
  benchmarks,
  onCreateBenchmark,
  onLoadBenchmark,
  onDeleteBenchmark
}: Props) {
  const hasBenchmarks = useMemo(
    () => benchmarks.length > 0,
    [benchmarks]
  );

  return (
    <section className="card">
      <h2>Developer Tools</h2>

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
    </section>
  );
}