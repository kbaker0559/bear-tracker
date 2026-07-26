import type { RoundPlayer } from '../types/roundPlayer';
import type {
  GreenieSelection,
  ResultsSettings
} from '../types/resultsSettings';
import { getPayoutLookup } from '../data/payoutLookup';

export const GREENIE_HOLES = [3, 5, 11, 15] as const;
export type GreenieHoleNumber = (typeof GREENIE_HOLES)[number];

export type GreenieHoleResult = {
  holeNumber: GreenieHoleNumber;
  status: 'pending' | 'no-winner' | 'winner';
  winnerId: string | null;
  winnerIds: string[];
  baseValue: number;
  carryIn: number;
  availableValue: number;
  calculatedAward: number;
  calculatedHoleTotal: number;
  finalHoleRedistribution: number;
  distance?: string;
  notes?: string;
};

export type GreeniesResult = {
  playerCount: number;
  greeniesPot: number;
  holes: GreenieHoleResult[];
  completedHoleCount: number;
  winningHoleCount: number;
  calculatedDistributed: number;
  calculatedRemainder: number;
  finalHoleRedistributionPool: number;
  finalHoleRedistributionEach: number;
  ready: boolean;
};

function isInactiveStatus(status: RoundPlayer['status']): boolean {
  return status === 'dns' || status === 'no-show' || status === 'withdrawn' || status === 'removed';
}

function selectionFor(
  selections: ResultsSettings['greenieSelections'],
  holeNumber: number
): GreenieSelection | undefined {
  return selections[String(holeNumber)];
}

function selectedWinnerIds(selection: GreenieSelection | undefined): string[] {
  if (!selection) return [];
  const ids = selection.winnerIds?.length
    ? selection.winnerIds
    : selection.winnerId
      ? [selection.winnerId]
      : [];
  return Array.from(new Set(ids.filter(Boolean)));
}

export function getGreenieEligiblePlayerIds(roundPlayers: RoundPlayer[]): Set<string> {
  return new Set(
    roundPlayers
      .filter((player) => player.isEligibleForGreenies && !isInactiveStatus(player.status))
      .map((player) => player.playerId)
  );
}

export function calculateGreenies(
  roundPlayers: RoundPlayer[],
  selections: ResultsSettings['greenieSelections']
): GreeniesResult {
  const eligibleIds = getGreenieEligiblePlayerIds(roundPlayers);
  const playerCount = eligibleIds.size;
  const payoutRow = playerCount >= 4 && playerCount <= 40 ? getPayoutLookup(playerCount) : null;
  const greeniesPot = payoutRow
    ? Object.values(payoutRow.greenies).reduce((total, amount) => total + amount, 0)
    : 0;

  const holes: GreenieHoleResult[] = [];
  let carry = 0;

  for (const holeNumber of GREENIE_HOLES) {
    const baseValue = payoutRow?.greenies[holeNumber] ?? 0;
    const availableValue = baseValue + carry;
    const selection = selectionFor(selections, holeNumber);
    const winnerIds = selectedWinnerIds(selection);
    const validWinners = winnerIds.length > 0 && winnerIds.every((id) => eligibleIds.has(id));

    if (!selection?.decided || (winnerIds.length > 0 && !validWinners)) {
      holes.push({
        holeNumber, status: 'pending', winnerId: null, winnerIds: [], baseValue,
        carryIn: carry, availableValue, calculatedAward: 0, calculatedHoleTotal: 0,
        finalHoleRedistribution: 0, distance: selection?.distance, notes: selection?.notes
      });
      carry = availableValue;
      continue;
    }

    if (validWinners) {
      const each = availableValue / winnerIds.length;
      holes.push({
        holeNumber, status: 'winner', winnerId: winnerIds[0], winnerIds, baseValue,
        carryIn: carry, availableValue, calculatedAward: each,
        calculatedHoleTotal: availableValue, finalHoleRedistribution: 0,
        distance: selection?.distance, notes: selection?.notes
      });
      carry = 0;
      continue;
    }

    holes.push({
      holeNumber, status: 'no-winner', winnerId: null, winnerIds: [], baseValue,
      carryIn: carry, availableValue, calculatedAward: 0, calculatedHoleTotal: 0,
      finalHoleRedistribution: 0, distance: selection?.distance, notes: selection?.notes
    });
    carry = availableValue;
  }

  let finalHoleRedistributionPool = 0;
  let finalHoleRedistributionEach = 0;
  const finalHole = holes[holes.length - 1];
  if (finalHole?.status === 'no-winner' && finalHole.availableValue > 0) {
    const earlierWinningHoles = holes.filter(
      (hole) => hole.holeNumber !== finalHole.holeNumber && hole.status === 'winner'
    );
    finalHoleRedistributionPool = finalHole.availableValue;
    if (earlierWinningHoles.length > 0) {
      finalHoleRedistributionEach = finalHoleRedistributionPool / earlierWinningHoles.length;
      for (const winnerHole of earlierWinningHoles) {
        winnerHole.finalHoleRedistribution = finalHoleRedistributionEach;
        winnerHole.calculatedHoleTotal += finalHoleRedistributionEach;
        winnerHole.calculatedAward = winnerHole.calculatedHoleTotal / winnerHole.winnerIds.length;
      }
    }
  }

  const calculatedDistributed = holes.reduce(
    (total, hole) => total + hole.calculatedAward * hole.winnerIds.length,
    0
  );
  const completedHoleCount = holes.filter((hole) => hole.status !== 'pending').length;
  const winningHoleCount = holes.filter((hole) => hole.status === 'winner').length;

  return {
    playerCount, greeniesPot, holes, completedHoleCount, winningHoleCount,
    calculatedDistributed, calculatedRemainder: greeniesPot - calculatedDistributed,
    finalHoleRedistributionPool, finalHoleRedistributionEach,
    ready: completedHoleCount === GREENIE_HOLES.length
  };
}
