import type { RoundBundle } from '../engine/roundEngine';

export type Benchmark = {
  id: string;

  name: string;

  description: string;

  createdAt: string;

  version: number;

  roundBundle: RoundBundle;
};

export type BenchmarkSummary = {
  id: string;

  name: string;

  description: string;

  createdAt: string;

  version: number;
};