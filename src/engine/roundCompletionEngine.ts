import type { ScorecardEntry } from '../types/scoreEntry';
import {
  hasPaperTotals,
  validateScorecardEntry
} from './scorecardValidationEngine';

export type RoundCompletionStatus =
  | 'no-scorecards'
  | 'scores-incomplete'
  | 'paper-totals-incomplete'
  | 'validation-errors'
  | 'ready'
  | 'complete';

export type RoundCompletionReadiness = {
  status: RoundCompletionStatus;
  label: string;
  readyToComplete: boolean;
  totalScorecards: number;
  verifiedScorecards: number;
  incompleteScorecards: number;
  missingPaperTotalsScorecards: number;
  validationErrorScorecards: number;
};

function scorecardHasValidationErrors(
  scorecardEntry: ScorecardEntry
): boolean {
  return (
    hasPaperTotals(scorecardEntry) &&
    !validateScorecardEntry(scorecardEntry).passed
  );
}

export function getRoundCompletionReadiness(
  scorecardEntries: ScorecardEntry[],
  roundIsComplete = false
): RoundCompletionReadiness {
  const totalScorecards = scorecardEntries.length;
  const verifiedScorecards =
    scorecardEntries.filter(
      (entry) => entry.status === 'verified'
    ).length;
  const incompleteScorecards =
    scorecardEntries.filter(
      (entry) =>
        entry.players.some(
          (playerEntry) =>
            playerEntry.scores.some(
              (score) => score.grossScore === null
            )
        )
    ).length;
  const missingPaperTotalsScorecards = 0;
  const validationErrorScorecards =
    scorecardEntries.filter(
      scorecardHasValidationErrors
    ).length;

  const shared = {
    totalScorecards,
    verifiedScorecards,
    incompleteScorecards,
    missingPaperTotalsScorecards,
    validationErrorScorecards
  };

  if (roundIsComplete) {
    return {
      ...shared,
      status: 'complete',
      label: 'Round Complete',
      readyToComplete: false
    };
  }

  if (totalScorecards === 0) {
    return {
      ...shared,
      status: 'no-scorecards',
      label: 'No Scorecards',
      readyToComplete: false
    };
  }

  if (incompleteScorecards > 0) {
    return {
      ...shared,
      status: 'scores-incomplete',
      label: 'Scores Still Incomplete',
      readyToComplete: false
    };
  }

  if (validationErrorScorecards > 0) {
    return {
      ...shared,
      status: 'validation-errors',
      label: 'Validation Errors Require Review',
      readyToComplete: false
    };
  }

  if (verifiedScorecards < totalScorecards) {
    return {
      ...shared,
      status: 'scores-incomplete',
      label: 'Scorecards Still Need Verification',
      readyToComplete: false
    };
  }

  return {
    ...shared,
    status: 'ready',
    label: 'All Scorecards Verified',
    readyToComplete: true
  };
}
