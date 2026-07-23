import type { ScorecardEntry } from '../types/scoreEntry';

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

function everyPlayerHasPaperTotals(
  scorecardEntry: ScorecardEntry
): boolean {
  const paperTotals =
    scorecardEntry.paperTotals ?? [];

  return scorecardEntry.players.every(
    (playerEntry) =>
      paperTotals.some(
        (paperEntry) =>
          paperEntry.playerId ===
          playerEntry.playerId
      )
  );
}

function scorecardHasValidationErrors(
  scorecardEntry: ScorecardEntry
): boolean {
  if (!everyPlayerHasPaperTotals(scorecardEntry)) {
    return false;
  }

  return scorecardEntry.players.some(
    (playerEntry) => {
      const paper =
  (scorecardEntry.paperTotals ?? []).find(
          (paperEntry) =>
            paperEntry.playerId ===
            playerEntry.playerId
        );

      if (!paper) {
        return false;
      }

      return (
        (
          paper.frontNineGross !== null &&
          paper.frontNineGross !==
            playerEntry.frontNineGrossTotal
        ) ||
        (
          paper.backNineGross !== null &&
          paper.backNineGross !==
            playerEntry.backNineGrossTotal
        ) ||
        (
          paper.grossTotal !== null &&
          paper.grossTotal !==
            playerEntry.grossTotal
        ) ||
        (
          paper.frontNinePoints !== null &&
          paper.frontNinePoints !==
            playerEntry.frontNinePoints
        ) ||
        (
          paper.backNinePoints !== null &&
          paper.backNinePoints !==
            playerEntry.backNinePoints
        ) ||
        (
          paper.totalPoints !== null &&
          paper.totalPoints !==
            playerEntry.stablefordPoints
        ) ||
        (
          paper.quota !== null &&
          paper.quota !==
            playerEntry.quota
        ) ||
        (
          paper.quotaResult !== null &&
          paper.quotaResult !==
            playerEntry.quotaResult
        )
      );
    }
  );
}

export function getRoundCompletionReadiness(
  scorecardEntries: ScorecardEntry[],
  roundIsComplete = false
): RoundCompletionReadiness {
  const totalScorecards =
    scorecardEntries.length;

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
              (score) =>
                score.grossScore === null
            )
        )
    ).length;

  const missingPaperTotalsScorecards =
    scorecardEntries.filter(
      (entry) =>
        entry.players.every(
          (playerEntry) =>
            playerEntry.scores.every(
              (score) =>
                score.grossScore !== null
            )
        ) &&
        !everyPlayerHasPaperTotals(entry)
    ).length;

  const validationErrorScorecards =
    scorecardEntries.filter(
      scorecardHasValidationErrors
    ).length;

  if (roundIsComplete) {
    return {
      status: 'complete',
      label: 'Round Complete',
      readyToComplete: false,
      totalScorecards,
      verifiedScorecards,
      incompleteScorecards,
      missingPaperTotalsScorecards,
      validationErrorScorecards
    };
  }

  if (totalScorecards === 0) {
    return {
      status: 'no-scorecards',
      label: 'No Scorecards',
      readyToComplete: false,
      totalScorecards,
      verifiedScorecards,
      incompleteScorecards,
      missingPaperTotalsScorecards,
      validationErrorScorecards
    };
  }

  if (incompleteScorecards > 0) {
    return {
      status: 'scores-incomplete',
      label: 'Scores Still Incomplete',
      readyToComplete: false,
      totalScorecards,
      verifiedScorecards,
      incompleteScorecards,
      missingPaperTotalsScorecards,
      validationErrorScorecards
    };
  }

  if (missingPaperTotalsScorecards > 0) {
    return {
      status: 'paper-totals-incomplete',
      label: 'Paper Totals Still Missing',
      readyToComplete: false,
      totalScorecards,
      verifiedScorecards,
      incompleteScorecards,
      missingPaperTotalsScorecards,
      validationErrorScorecards
    };
  }

  if (validationErrorScorecards > 0) {
    return {
      status: 'validation-errors',
      label: 'Validation Errors Require Review',
      readyToComplete: false,
      totalScorecards,
      verifiedScorecards,
      incompleteScorecards,
      missingPaperTotalsScorecards,
      validationErrorScorecards
    };
  }

  if (verifiedScorecards < totalScorecards) {
    return {
      status: 'scores-incomplete',
      label: 'Scorecards Still Need Verification',
      readyToComplete: false,
      totalScorecards,
      verifiedScorecards,
      incompleteScorecards,
      missingPaperTotalsScorecards,
      validationErrorScorecards
    };
  }

  return {
    status: 'ready',
    label: 'All Scorecards Verified',
    readyToComplete: true,
    totalScorecards,
    verifiedScorecards,
    incompleteScorecards,
    missingPaperTotalsScorecards,
    validationErrorScorecards
  };
}