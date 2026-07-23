import type {
  PlayerScoreEntry,
  ScorecardEntry
} from '../types/scoreEntry';
import type { PaperPlayerTotals } from '../types/paperScorecardTotals';
import type {
  PlayerValidationIssue,
  ScorecardValidationResult
} from '../types/scorecardValidation';

type NumericField =
  | 'frontNineGross'
  | 'backNineGross'
  | 'grossTotal'
  | 'frontNinePoints'
  | 'backNinePoints'
  | 'totalPoints'
  | 'quota'
  | 'quotaResult';

function addIssue(
  issues: PlayerValidationIssue[],
  playerId: string,
  field: PlayerValidationIssue['field'],
  expected: number,
  actual: number,
  message: string
): void {
  issues.push({
    playerId,
    field,
    expected,
    actual,
    severity: 'warning',
    message
  });
}

function compareValue(
  issues: PlayerValidationIssue[],
  playerId: string,
  field: PlayerValidationIssue['field'],
  label: string,
  paperValue: number | null,
  calculatedValue: number | null
): void {
  if (
    paperValue === null ||
    calculatedValue === null
  ) {
    return;
  }

  if (paperValue === calculatedValue) {
    return;
  }

  addIssue(
    issues,
    playerId,
    field,
    calculatedValue,
    paperValue,
    `${label} does not match. Paper: ${paperValue}. Calculated: ${calculatedValue}.`
  );
}

function validatePlayerTotals(
  paper: PaperPlayerTotals,
  calculated: PlayerScoreEntry
): PlayerValidationIssue[] {
  const issues: PlayerValidationIssue[] = [];

  compareValue(
    issues,
    paper.playerId,
    'front-nine',
    'Front-nine gross',
    paper.frontNineGross,
    calculated.frontNineGrossTotal
  );

  compareValue(
    issues,
    paper.playerId,
    'back-nine',
    'Back-nine gross',
    paper.backNineGross,
    calculated.backNineGrossTotal
  );

  compareValue(
    issues,
    paper.playerId,
    'total',
    'Total gross',
    paper.grossTotal,
    calculated.grossTotal
  );

  compareValue(
    issues,
    paper.playerId,
    'front-nine',
    'Front-nine points',
    paper.frontNinePoints,
    calculated.frontNinePoints
  );

  compareValue(
    issues,
    paper.playerId,
    'back-nine',
    'Back-nine points',
    paper.backNinePoints,
    calculated.backNinePoints
  );

  compareValue(
    issues,
    paper.playerId,
    'total',
    'Total points',
    paper.totalPoints,
    calculated.stablefordPoints
  );

  compareValue(
    issues,
    paper.playerId,
    'quota',
    'Quota',
    paper.quota,
    calculated.quota
  );

  compareValue(
    issues,
    paper.playerId,
    'quota',
    'Quota result',
    paper.quotaResult,
    calculated.quotaResult
  );

  return issues;
}

export function validateScorecardEntry(
  scorecardEntry: ScorecardEntry
): ScorecardValidationResult {
  const issues: PlayerValidationIssue[] = [];

  for (
  const paperTotals of
  scorecardEntry.paperTotals ?? []
) {
    const calculatedPlayer =
      scorecardEntry.players.find(
        (playerEntry) =>
          playerEntry.playerId ===
          paperTotals.playerId
      );

    if (!calculatedPlayer) {
      continue;
    }

    issues.push(
      ...validatePlayerTotals(
        paperTotals,
        calculatedPlayer
      )
    );
  }

  return {
    passed: issues.length === 0,
    issues
  };
}

export function hasPaperTotals(
  scorecardEntry: ScorecardEntry
): boolean {
  return (
  scorecardEntry.paperTotals?.length ?? 0
) > 0;
}