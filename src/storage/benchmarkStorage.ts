import type {
  Benchmark,
  BenchmarkSummary
} from '../types/benchmark';

const STORAGE_KEY = 'glos-benchmarks';

function loadAllBenchmarks(): Benchmark[] {
  try {
    const savedValue =
      window.localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return [];
    }

    const parsed =
      JSON.parse(savedValue) as Benchmark[];

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      'Could not load saved benchmarks.',
      error
    );

    return [];
  }
}

function saveAllBenchmarks(
  benchmarks: Benchmark[]
): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(benchmarks)
    );
  } catch (error) {
    console.error(
      'Could not save benchmarks.',
      error
    );

    throw new Error(
      'The benchmark could not be saved.'
    );
  }
}

export function saveBenchmark(
  benchmark: Benchmark
): void {
  const existing =
    loadAllBenchmarks();

  const benchmarkAlreadyExists =
    existing.some(
      (candidate) =>
        candidate.id === benchmark.id
    );

  const updatedBenchmarks =
    benchmarkAlreadyExists
      ? existing.map((candidate) =>
          candidate.id === benchmark.id
            ? benchmark
            : candidate
        )
      : [...existing, benchmark];

  saveAllBenchmarks(updatedBenchmarks);
}

export function listBenchmarks():
  BenchmarkSummary[] {
  return loadAllBenchmarks()
    .map((benchmark) => ({
      id: benchmark.id,
      name: benchmark.name,
      description: benchmark.description,
      createdAt: benchmark.createdAt,
      version: benchmark.version
    }))
    .sort(
      (first, second) =>
        second.createdAt.localeCompare(
          first.createdAt
        )
    );
}

export function getBenchmark(
  benchmarkId: string
): Benchmark | null {
  return (
    loadAllBenchmarks().find(
      (benchmark) =>
        benchmark.id === benchmarkId
    ) ?? null
  );
}

export function deleteBenchmark(
  benchmarkId: string
): void {
  const remainingBenchmarks =
    loadAllBenchmarks().filter(
      (benchmark) =>
        benchmark.id !== benchmarkId
    );

  saveAllBenchmarks(
    remainingBenchmarks
  );
}