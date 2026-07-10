export type ParsedPairingPlayer = {
  name: string;
  tee: string;
  handicap: number;
};

export type ParsedPairingGroup = {
  groupNumber: number;
  teeTime: string;
  players: ParsedPairingPlayer[];
};

function normalizeTeeTime(value: string): string {
  const cleaned = value.trim();

  const match = cleaned.match(
    /^(\d{1,2}):?(\d{2})\s*(am|pm)$/i
  );

  if (!match) return cleaned;

  return `${Number(match[1])}:${match[2]} ${match[3].toUpperCase()}`;
}

function isTeeTime(value: string): boolean {
  return /^\d{1,2}:?\d{2}\s*(am|pm)$/i.test(value.trim());
}

export function parsePairingsEmail(
  text: string
): ParsedPairingGroup[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const groups: ParsedPairingGroup[] = [];
  let currentGroup: ParsedPairingGroup | null = null;

  for (const line of lines) {
    if (/^name\s+tees\s+handicap$/i.test(line)) {
      continue;
    }

    const columns = line
      .split(/\t+/)
      .map((part) => part.trim())
      .filter(Boolean);

    if (columns.length < 3) {
      continue;
    }

    const firstColumn = columns[0];
    const groupMatch = firstColumn.match(/^Group\s+(\d+)$/i);

    if (groupMatch) {
      currentGroup = {
        groupNumber: Number(groupMatch[1]),
        teeTime: '',
        players: []
      };

      groups.push(currentGroup);

      if (columns.length >= 4) {
        currentGroup.players.push({
          name: columns[1],
          tee: columns[2].toUpperCase(),
          handicap: Number(columns[3])
        });
      }

      continue;
    }

    if (isTeeTime(firstColumn) && currentGroup) {
      currentGroup.teeTime = normalizeTeeTime(firstColumn);

      if (columns.length >= 4) {
        currentGroup.players.push({
          name: columns[1],
          tee: columns[2].toUpperCase(),
          handicap: Number(columns[3])
        });
      }

      continue;
    }

    if (currentGroup && columns.length >= 3) {
      currentGroup.players.push({
        name: columns[0],
        tee: columns[1].toUpperCase(),
        handicap: Number(columns[2])
      });
    }
  }

  return groups;
}