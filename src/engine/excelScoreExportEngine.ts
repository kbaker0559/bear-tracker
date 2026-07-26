import type { Player } from '../types';
import type { RoundPlayer } from '../types/roundPlayer';
import type { Scorecard } from '../types/scorecard';
import type { ScorecardEntry } from '../types/scoreEntry';

const NON_PARTICIPATING = new Set([
  'dns',
  'withdrawn',
  'no-show',
  'removed'
]);

export const EXCEL_EXPORT_COLUMN_COUNT = 24;

type ExportRow = Array<string | number>;

export type ExcelScoreExport = {
  rows: ExportRow[];
  text: string;
  playerCount: number;
  playedCount: number;
  errors: string[];
};

function splitPlayerName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: '', lastName: '' };
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

function rosterSortKey(player: Player): string {
  const { firstName, lastName } = splitPlayerName(player.name);
  return `${lastName.toLocaleLowerCase()}\u0000${firstName.toLocaleLowerCase()}`;
}

function rowToClipboardText(row: ExportRow): string {
  // Deliberately emit exactly 24 tab-separated fields. Do not append totals or
  // trailing fields, because columns 25+ in the user's workbook contain formulas.
  if (row.length !== EXCEL_EXPORT_COLUMN_COUNT) {
    throw new Error(`Excel export row has ${row.length} columns instead of 24.`);
  }
  return row.map((value) => String(value ?? '')).join('\t');
}

export function buildExcelScoreExport(
  players: Player[],
  roundPlayers: RoundPlayer[],
  scorecards: Scorecard[],
  scorecardEntries: ScorecardEntry[]
): ExcelScoreExport {
  const errors: string[] = [];
  const roundPlayerById = new Map(
    roundPlayers.map((roundPlayer) => [roundPlayer.playerId, roundPlayer])
  );
  const entryByCardId = new Map(
    scorecardEntries.map((entry) => [entry.scorecardId, entry])
  );
  const playerById = new Map(players.map((player) => [player.id, player]));

  const playedIds: string[] = [];
  const playedRows: ExportRow[] = [];
  let playOrder = 1;

  const orderedCards = [...scorecards].sort(
    (a, b) => a.cardNumber - b.cardNumber
  );

  for (const card of orderedCards) {
    const entry = entryByCardId.get(card.id);
    if (!entry) {
      errors.push(`Card ${card.cardNumber} has no score-entry record.`);
      continue;
    }
    if (entry.status !== 'verified') {
      errors.push(`Card ${card.cardNumber} is not verified.`);
    }

    const scoreByPlayerId = new Map(
      entry.players.map((playerEntry) => [playerEntry.playerId, playerEntry])
    );

    for (const cardPlayer of card.players) {
      const roundPlayer = roundPlayerById.get(cardPlayer.playerId);
      if (!roundPlayer || NON_PARTICIPATING.has(roundPlayer.status)) continue;

      const player = playerById.get(cardPlayer.playerId);
      const playerEntry = scoreByPlayerId.get(cardPlayer.playerId);
      if (!player) {
        errors.push(`Player ${cardPlayer.playerId} is missing from the league roster.`);
        continue;
      }
      if (!playerEntry) {
        errors.push(`${player.name} is assigned to Card ${card.cardNumber} but has no score entry.`);
        continue;
      }

      const grossScores = playerEntry.scores
        .slice()
        .sort((a, b) => a.holeNumber - b.holeNumber)
        .map((score) => score.grossScore);

      if (grossScores.length !== 18 || grossScores.some((score) => score === null)) {
        errors.push(`${player.name} does not have all 18 gross scores.`);
      }

      const { firstName, lastName } = splitPlayerName(player.name);
      const row: ExportRow = [
        playOrder,
        firstName,
        lastName,
        1,
        playerEntry.courseHandicap,
        playerEntry.quota,
        ...grossScores.map((score) => score ?? '')
      ];

      if (row.length !== EXCEL_EXPORT_COLUMN_COUNT) {
        errors.push(`${player.name} generated ${row.length} export columns instead of 24.`);
      }

      playedIds.push(player.id);
      playedRows.push(row);
      playOrder += 1;
    }
  }

  const playedIdSet = new Set(playedIds);
  const nonPlayingRows = players
    .filter((player) => !playedIdSet.has(player.id))
    .sort((a, b) => rosterSortKey(a).localeCompare(rosterSortKey(b)))
    .map((player): ExportRow => {
      const { firstName, lastName } = splitPlayerName(player.name);
      return [
        '',
        firstName,
        lastName,
        '',
        player.handicap,
        player.quota,
        ...Array.from({ length: 18 }, () => '')
      ];
    });

  const rows = [...playedRows, ...nonPlayingRows];
  const duplicatePlayedIds = playedIds.filter(
    (playerId, index) => playedIds.indexOf(playerId) !== index
  );
  if (duplicatePlayedIds.length > 0) {
    const names = [...new Set(duplicatePlayedIds)]
      .map((playerId) => playerById.get(playerId)?.name ?? playerId)
      .join(', ');
    errors.push(`Players appear more than once in scorecard order: ${names}.`);
  }
  if (rows.length !== players.length) {
    errors.push(
      `Export contains ${rows.length} rows, but the league roster contains ${players.length}.`
    );
  }

  return {
    rows,
    text: rows.map(rowToClipboardText).join('\n'),
    playerCount: players.length,
    playedCount: playedRows.length,
    errors
  };
}
