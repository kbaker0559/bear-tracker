import type { Hole } from '../types';
import type {
  ExtractedScoreCell,
  RecognitionDecision,
  ScorecardPlayerTotalsReview
} from '../types/scorecardImport';

export type RVEPlayerContext = {
  playerId: string;
  playerName: string;
  handicapAtPairing: number;
};

export type RVEInput = {
  cells: ExtractedScoreCell[];
  playerContexts: RVEPlayerContext[];
  holes: Hole[];
  totals: ScorecardPlayerTotalsReview[];
};

export type RVEResult = {
  cells: ExtractedScoreCell[];
  totals: ScorecardPlayerTotalsReview[];
  decisions: RecognitionDecision[];
  unresolvedMessages: string[];
};

function strokeForHole(handicap: number, strokeIndex: number): 0 | 1 {
  // Black Bear cards use no more than one net stroke per hole.
  return handicap >= strokeIndex ? 1 : 0;
}

function sumRange(cells: ExtractedScoreCell[], playerId: string, first: number, last: number): number | null {
  const range = cells
    .filter((cell) => cell.playerId === playerId && cell.holeNumber >= first && cell.holeNumber <= last)
    .sort((a, b) => a.holeNumber - b.holeNumber);
  if (range.length !== last - first + 1 || range.some((cell) => cell.extractedScore === null)) return null;
  return range.reduce((sum, cell) => sum + (cell.extractedScore ?? 0), 0);
}

function decisionId(playerId: string, holeNumber: number, kind: string): string {
  return `${playerId}-${holeNumber}-${kind}`;
}

function applyGrossNetRules(
  sourceCells: ExtractedScoreCell[],
  playerContexts: RVEPlayerContext[],
  holes: Hole[]
): { cells: ExtractedScoreCell[]; decisions: RecognitionDecision[]; unresolvedMessages: string[] } {
  const decisions: RecognitionDecision[] = [];
  const unresolvedMessages: string[] = [];

  const cells = sourceCells.map((cell) => {
    const context = playerContexts.find((item) => item.playerId === cell.playerId);
    const hole = holes.find((item) => item.number === cell.holeNumber);
    if (!context || !hole || cell.extractedNetScore === null || cell.extractedNetScore === undefined) return cell;

    const strokes = strokeForHole(context.handicapAtPairing, hole.strokeIndex);
    const requiredGross = cell.extractedNetScore + strokes;
    if (requiredGross < 1 || requiredGross > 15) {
      unresolvedMessages.push(`${context.playerName}, hole ${cell.holeNumber}: NET ${cell.extractedNetScore} produces an invalid gross score.`);
      return { ...cell, requiresReview: true, confidence: 'low' as const };
    }

    if (cell.extractedScore === requiredGross) {
      return {
        ...cell,
        validationNotes: [
          ...(cell.validationNotes ?? []),
          `Gross/NET check passed: NET ${cell.extractedNetScore} + ${strokes} stroke${strokes === 1 ? '' : 's'} = gross ${requiredGross}.`
        ]
      };
    }

    const original = cell.extractedScore;
    const reason = strokes === 1
      ? `NET is ${cell.extractedNetScore} and the player receives one stroke, so gross must be ${requiredGross}.`
      : `NET is ${cell.extractedNetScore} and the player receives no stroke, so gross must also be ${requiredGross}.`;

    decisions.push({
      id: decisionId(cell.playerId, cell.holeNumber, 'gross-net'),
      playerId: cell.playerId,
      holeNumber: cell.holeNumber,
      originalScore: original,
      recommendedScore: requiredGross,
      appliedAutomatically: true,
      confidenceAfterValidation: 0.99,
      reasons: [reason, original === null ? 'The gross score was unreadable.' : `The OCR gross score of ${original} violates the gross/NET relationship.`]
    });

    return {
      ...cell,
      rawExtractedScore: original,
      extractedScore: requiredGross,
      confirmedScore: requiredGross,
      confidence: 'high' as const,
      requiresReview: false,
      reviewReason: undefined,
      correctedByValidation: true,
      validationNotes: [reason]
    };
  });

  return { cells, decisions, unresolvedMessages };
}

function applySingleThreeFiveTotalRepair(
  sourceCells: ExtractedScoreCell[],
  playerContexts: RVEPlayerContext[],
  totals: ScorecardPlayerTotalsReview[]
): { cells: ExtractedScoreCell[]; decisions: RecognitionDecision[] } {
  let cells = sourceCells;
  const decisions: RecognitionDecision[] = [];

  for (const context of playerContexts) {
    const totalsRow = totals.find((item) => item.playerId === context.playerId);
    if (!totalsRow) continue;

    for (const segment of [
      { first: 1, last: 9, handwritten: totalsRow.handwrittenFrontNine, label: 'OUT' },
      { first: 10, last: 18, handwritten: totalsRow.handwrittenBackNine, label: 'IN' }
    ] as const) {
      if (segment.handwritten === null) continue;
      const calculated = sumRange(cells, context.playerId, segment.first, segment.last);
      if (calculated === null || calculated === segment.handwritten) continue;
      const difference = segment.handwritten - calculated;
      if (Math.abs(difference) !== 2) continue;

      const fromScore = difference === 2 ? 3 : 5;
      const toScore = difference === 2 ? 5 : 3;
      const candidates = cells.filter((cell) =>
        cell.playerId === context.playerId &&
        cell.holeNumber >= segment.first &&
        cell.holeNumber <= segment.last &&
        cell.extractedScore === fromScore &&
        !cell.correctedByValidation &&
        (cell.recognitionConfidence ?? 0) < 0.9
      );

      // Only repair when exactly one low-confidence 3/5 cell explains the entire total difference.
      if (candidates.length !== 1) continue;
      const candidate = candidates[0];
      const reason = `${segment.label} total is ${segment.handwritten}; changing hole ${candidate.holeNumber} from ${fromScore} to ${toScore} makes the arithmetic agree exactly.`;
      decisions.push({
        id: decisionId(candidate.playerId, candidate.holeNumber, 'total'),
        playerId: candidate.playerId,
        holeNumber: candidate.holeNumber,
        originalScore: fromScore,
        recommendedScore: toScore,
        appliedAutomatically: true,
        confidenceAfterValidation: 0.96,
        reasons: [reason, 'The original OCR confidence was below the automatic-confirmation threshold.']
      });
      cells = cells.map((cell) => cell === candidate ? {
        ...cell,
        rawExtractedScore: fromScore,
        extractedScore: toScore,
        confirmedScore: toScore,
        confidence: 'high' as const,
        requiresReview: false,
        correctedByValidation: true,
        validationNotes: [...(cell.validationNotes ?? []), reason]
      } : cell);
    }
  }

  return { cells, decisions };
}

function refreshTotals(cells: ExtractedScoreCell[], totals: ScorecardPlayerTotalsReview[]): ScorecardPlayerTotalsReview[] {
  return totals.map((row) => {
    const calculatedFrontNine = sumRange(cells, row.playerId, 1, 9);
    const calculatedBackNine = sumRange(cells, row.playerId, 10, 18);
    const calculatedTotal = calculatedFrontNine !== null && calculatedBackNine !== null
      ? calculatedFrontNine + calculatedBackNine
      : null;
    return {
      ...row,
      calculatedFrontNine,
      calculatedBackNine,
      calculatedTotal,
      frontNineMatches: calculatedFrontNine === null || row.handwrittenFrontNine === null ? null : calculatedFrontNine === row.handwrittenFrontNine,
      backNineMatches: calculatedBackNine === null || row.handwrittenBackNine === null ? null : calculatedBackNine === row.handwrittenBackNine,
      totalMatches: calculatedTotal === null || row.handwrittenTotal === null ? null : calculatedTotal === row.handwrittenTotal
    };
  });
}

export function runRecognitionValidation(input: RVEInput): RVEResult {
  const grossNet = applyGrossNetRules(input.cells, input.playerContexts, input.holes);
  const totalRepair = applySingleThreeFiveTotalRepair(grossNet.cells, input.playerContexts, input.totals);
  const refreshedTotals = refreshTotals(totalRepair.cells, input.totals);
  const unresolvedMessages = [...grossNet.unresolvedMessages];

  for (const row of refreshedTotals) {
    const playerName = input.playerContexts.find((player) => player.playerId === row.playerId)?.playerName ?? row.playerId;
    if (row.frontNineMatches === false) unresolvedMessages.push(`${playerName}: holes 1-9 add to ${row.calculatedFrontNine}, but the handwritten OUT total appears to be ${row.handwrittenFrontNine}.`);
    if (row.backNineMatches === false) unresolvedMessages.push(`${playerName}: holes 10-18 add to ${row.calculatedBackNine}, but the handwritten IN total appears to be ${row.handwrittenBackNine}.`);
    if (row.totalMatches === false) unresolvedMessages.push(`${playerName}: the 18 hole scores add to ${row.calculatedTotal}, but the handwritten total appears to be ${row.handwrittenTotal}.`);
  }

  return {
    cells: totalRepair.cells,
    totals: refreshedTotals,
    decisions: [...grossNet.decisions, ...totalRepair.decisions],
    unresolvedMessages
  };
}
