import type { Player } from '../types';

const suffixes = ['JR', 'JR.', 'SR', 'SR.', 'II', 'III', 'IV'];

function sortableName(name: string): string {
  const parts = name.trim().split(/\s+/);

  if (
    parts.length > 2 &&
    suffixes.includes(parts[parts.length - 1].toUpperCase())
  ) {
    parts.pop();
  }

  const last = parts.pop() ?? '';
  const first = parts.join(' ');

  return `${last}, ${first}`;
}

export function sortPlayersByLastName(players: Player[]): Player[] {
  return [...players].sort((a, b) =>
    sortableName(a.name).localeCompare(sortableName(b.name))
  );
}