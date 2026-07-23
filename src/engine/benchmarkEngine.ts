import type { Benchmark } from '../types/benchmark';
import type { RoundBundle } from './roundEngine';

export function createBenchmark(
  name: string,
  description: string,
  roundBundle: RoundBundle
): Benchmark {
  return {
    id: crypto.randomUUID(),

    name,

    description,

    createdAt: new Date().toISOString(),

    version: 1,

    roundBundle:
      structuredClone(roundBundle)
  };
}

export function loadBenchmark(
  benchmark: Benchmark
): RoundBundle {
  const loadedRound =
    structuredClone(
      benchmark.roundBundle
    );

  return {
    ...loadedRound,

    roundPlayers:
      loadedRound.roundPlayers ?? [],

    scorecards:
      loadedRound.scorecards ?? [],

    scorecardImports:
      loadedRound.scorecardImports ?? [],

    scorecardEntries:
      (
        loadedRound.scorecardEntries ?? []
      ).map((entry) => ({
        ...entry,
        paperTotals:
          entry.paperTotals ?? []
      })),

    scoreCorrections:
      loadedRound.scoreCorrections ?? [],

    tournamentEvents:
      loadedRound.tournamentEvents ?? []
  };
}