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
  baseValue: number;
  carryIn: number;
  availableValue: number;
  calculatedAward: number;
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
  return (
    status === 'dns' ||
    status === 'no-show' ||
    status === 'withdrawn' ||
    status === 'removed'
  );
}

function selectionFor(
  selections: ResultsSettings['greenieSelections'],
  holeNumber: number
): GreenieSelection | undefined {
  return selections[String(holeNumber)];
}

export function getGreenieEligiblePlayerIds(
  roundPlayers: RoundPlayer[]
): Set<string> {
  return new Set(
    roundPlayers
      .filter(
        (player) =>
          player.isEligibleForGreenies &&
          !isInactiveStatus(player.status)
      )
      .map((player) => player.playerId)
  );
}

export function calculateGreenies(
  roundPlayers: RoundPlayer[],
  selections: ResultsSettings['greenieSelections']
): GreeniesResult {
  const eligibleIds = getGreenieEligiblePlayerIds(roundPlayers);
  const playerCount = eligibleIds.size;
  const payoutRow =
    playerCount >= 4 && playerCount <= 40
      ? getPayoutLookup(playerCount)
      : null;
  const greeniesPot = payoutRow
    ? Object.values(payoutRow.greenies).reduce(
        (total, amount) => total + amount,
        0
      )
    : 0;

  const holes: GreenieHoleResult[] = [];
  let carry = 0;

  for (const holeNumber of GREENIE_HOLES) {
    const baseValue = payoutRow?.greenies[holeNumber] ?? 0;
    const availableValue = baseValue + carry;
    const selection = selectionFor(selections, holeNumber);
    const validWinner =
      selection?.winnerId !== null &&
      selection?.winnerId !== undefined &&
      eligibleIds.has(selection.winnerId);

    if (!selection?.decided || (selection.winnerId && !validWinner)) {
      holes.push({
        holeNumber,
        status: 'pending',
        winnerId: null,
        baseValue,
        carryIn: carry,
        availableValue,
        calculatedAward: 0,
        finalHoleRedistribution: 0,
        distance: selection?.distance,
        notes: selection?.notes
      });
      carry = availableValue;
      continue;
    }

    if (validWinner) {
      holes.push({
        holeNumber,
        status: 'winner',
        winnerId: selection.winnerId,
        baseValue,
        carryIn: carry,
        availableValue,
        calculatedAward: availableValue,
        finalHoleRedistribution: 0,
        distance: selection.distance,
        notes: selection.notes
      });
      carry = 0;
      continue;
    }

    holes.push({
      holeNumber,
      status: 'no-winner',
      winnerId: null,
      baseValue,
      carryIn: carry,
      availableValue,
      calculatedAward: 0,
      finalHoleRedistribution: 0,
      distance: selection.distance,
      notes: selection.notes
    });
    carry = availableValue;
  }

  let finalHoleRedistributionPool = 0;
  let finalHoleRedistributionEach = 0;
  const finalHole = holes[holes.length - 1];

  if (finalHole?.status === 'no-winner' && finalHole.availableValue > 0) {
    const earlierWinners = holes.filter(
      (hole) =>
        hole.holeNumber !== finalHole.holeNumber &&
        hole.status === 'winner'
    );

    finalHoleRedistributionPool = finalHole.availableValue;

    if (earlierWinners.length > 0) {
      finalHoleRedistributionEach = Math.floor(
        finalHoleRedistributionPool / earlierWinners.length
      );

      for (const winner of earlierWinners) {
        winner.finalHoleRedistribution = finalHoleRedistributionEach;
        winner.calculatedAward += finalHoleRedistributionEach;
      }
    }
  }

  const calculatedDistributed = holes.reduce(
    (total, hole) => total + hole.calculatedAward,
    0
  );
  const completedHoleCount = holes.filter(
    (hole) => hole.status !== 'pending'
  ).length;
  const winningHoleCount = holes.filter(
    (hole) => hole.status === 'winner'
  ).length;

  return {
    playerCount,
    greeniesPot,
    holes,
    completedHoleCount,
    winningHoleCount,
    calculatedDistributed,
    calculatedRemainder: greeniesPot - calculatedDistributed,
    finalHoleRedistributionPool,
    finalHoleRedistributionEach,
    ready: completedHoleCount === GREENIE_HOLES.length
  };
}
