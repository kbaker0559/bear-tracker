import type { Scorecard } from '../types/scorecard';
import type {
  ExtractedScoreCell,
  ScorecardImport,
  ScorecardImportIssue
} from '../types/scorecardImport';

function createEmptyCells(scorecard: Scorecard): ExtractedScoreCell[] {
  return scorecard.players.flatMap((player) =>
    Array.from({ length: 18 }, (_, index) => ({
      playerId: player.playerId,
      holeNumber: index + 1,
      extractedScore: null,
      confirmedScore: null,
      confidence: 'missing' as const,
      requiresReview: true,
      reviewReason: 'No score has been extracted.'
    }))
  );
}

function createMissingScoreIssues(
  scorecard: Scorecard
): ScorecardImportIssue[] {
  return scorecard.players.flatMap((player) =>
    Array.from({ length: 18 }, (_, index) => ({
      id: crypto.randomUUID(),
      type: 'missing-score' as const,
      message: `No score is available for hole ${index + 1}.`,
      playerId: player.playerId,
      holeNumber: index + 1,
      resolved: false
    }))
  );
}

export function createScorecardImport(
  roundId: string,
  scorecard: Scorecard
): ScorecardImport {
  return {
    id: crypto.randomUUID(),
    roundId,
    scorecardId: scorecard.id,
    status: 'waiting',
    cells: createEmptyCells(scorecard),
    issues: createMissingScoreIssues(scorecard)
  };
}

export function beginScorecardProcessing(
  scorecardImport: ScorecardImport,
  imageName?: string
): ScorecardImport {
  return {
    ...scorecardImport,
    status: 'processing',
    imageName
  };
}

export function failScorecardImport(
  scorecardImport: ScorecardImport,
  message: string
): ScorecardImport {
  return {
    ...scorecardImport,
    status: 'import-failed',
    issues: [
      ...scorecardImport.issues,
      {
        id: crypto.randomUUID(),
        type: 'other',
        message,
        resolved: false
      }
    ]
  };
}

export function countCellsNeedingReview(
  scorecardImport: ScorecardImport
): number {
  return scorecardImport.cells.filter(
    (cell) => cell.requiresReview
  ).length;
}

export function canCompleteScorecardImport(
  scorecardImport: ScorecardImport
): boolean {
  const allScoresConfirmed = scorecardImport.cells.every(
    (cell) => cell.confirmedScore !== null
  );

  const unresolvedIssues = scorecardImport.issues.some(
    (issue) => !issue.resolved
  );

  return allScoresConfirmed && !unresolvedIssues;
}