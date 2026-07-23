import type { ScorecardEntry } from '../types/scoreEntry';
import {
  hasPaperTotals,
  validateScorecardEntry
} from './scorecardValidationEngine';

export type CardHealthStatus =
  | 'waiting'
  | 'entering'
  | 'missing-paper-totals'
  | 'validation-errors'
  | 'ready-to-verify'
  | 'verified';

export type CardHealth = {
  status: CardHealthStatus;
  label: string;
  issueCount: number;

  completedPlayerCount: number;
  totalPlayerCount: number;
};

function playerIsComplete(
  scorecardEntry: ScorecardEntry,
  playerId: string
): boolean {
  const playerEntry =
    scorecardEntry.players.find(
      (player) =>
        player.playerId === playerId
    );

  return (
    playerEntry?.scores.every(
      (score) =>
        score.grossScore !== null
    ) ?? false
  );
}

export function getCardHealth(
  scorecardEntry: ScorecardEntry
): CardHealth {
  const totalPlayerCount =
    scorecardEntry.players.length;

  const completedPlayerCount =
    scorecardEntry.players.filter(
      (player) =>
        playerIsComplete(
          scorecardEntry,
          player.playerId
        )
    ).length;

  if (
    scorecardEntry.status === 'verified'
  ) {
    return {
      status: 'verified',
      label: 'Verified',
      issueCount: 0,
      completedPlayerCount,
      totalPlayerCount
    };
  }

  if (completedPlayerCount === 0) {
    return {
      status: 'waiting',
      label: 'Waiting',
      issueCount: 0,
      completedPlayerCount,
      totalPlayerCount
    };
  }

  if (
    completedPlayerCount <
    totalPlayerCount
  ) {
    return {
      status: 'entering',
      label: 'In Progress',
      issueCount: 0,
      completedPlayerCount,
      totalPlayerCount
    };
  }

  const everyPlayerHasPaperTotals =
    scorecardEntry.players.every(
      (playerEntry) =>
        scorecardEntry.paperTotals.some(
          (paperEntry) =>
            paperEntry.playerId ===
            playerEntry.playerId
        )
    );

  if (
    !hasPaperTotals(scorecardEntry) ||
    !everyPlayerHasPaperTotals
  ) {
    return {
      status: 'missing-paper-totals',
      label: 'Missing Paper Totals',
      issueCount: 0,
      completedPlayerCount,
      totalPlayerCount
    };
  }

  const validation =
    validateScorecardEntry(
      scorecardEntry
    );

  if (!validation.passed) {
    return {
      status: 'validation-errors',
      label: `Validation Errors (${validation.issues.length})`,
      issueCount:
        validation.issues.length,
      completedPlayerCount,
      totalPlayerCount
    };
  }

  return {
    status: 'ready-to-verify',
    label: 'Validated — Ready to Verify',
    issueCount: 0,
    completedPlayerCount,
    totalPlayerCount
  };
}