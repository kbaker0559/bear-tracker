import type { ScorecardEntry } from '../types/scoreEntry';

export type LeaderboardStatus =
  | 'incomplete'
  | 'complete'
  | 'verified';

export type LeaderboardPlayer = {
  playerId: string;

  grossTotal: number | null;
  stablefordPoints: number | null;

  quota: number;
  quotaResult: number | null;

  status: LeaderboardStatus;
};

function getPlayerStatus(
  scorecardEntry: ScorecardEntry
): LeaderboardStatus {
  if (scorecardEntry.status === 'verified') {
    return 'verified';
  }

  if (scorecardEntry.status === 'complete') {
    return 'complete';
  }

  return 'incomplete';
}

export function buildLeaderboard(
  scorecardEntries: ScorecardEntry[]
): LeaderboardPlayer[] {
  const leaderboardPlayers =
    scorecardEntries.flatMap((scorecardEntry) => {
      const status =
        getPlayerStatus(scorecardEntry);

      return scorecardEntry.players.map(
        (playerEntry): LeaderboardPlayer => ({
          playerId: playerEntry.playerId,

          grossTotal:
            playerEntry.grossTotal,

          stablefordPoints:
            playerEntry.stablefordPoints,

          quota: playerEntry.quota,

          quotaResult:
            playerEntry.quotaResult,

          status
        })
      );
    });

  return leaderboardPlayers.sort(
    (first, second) => {
      const firstComplete =
        first.quotaResult !== null;

      const secondComplete =
        second.quotaResult !== null;

      if (firstComplete && !secondComplete) {
        return -1;
      }

      if (!firstComplete && secondComplete) {
        return 1;
      }

      if (
        first.quotaResult !== null &&
        second.quotaResult !== null &&
        first.quotaResult !==
          second.quotaResult
      ) {
        return (
          second.quotaResult -
          first.quotaResult
        );
      }

      if (
        first.stablefordPoints !== null &&
        second.stablefordPoints !== null &&
        first.stablefordPoints !==
          second.stablefordPoints
      ) {
        return (
          second.stablefordPoints -
          first.stablefordPoints
        );
      }

      if (
        first.grossTotal !== null &&
        second.grossTotal !== null &&
        first.grossTotal !==
          second.grossTotal
      ) {
        return (
          first.grossTotal -
          second.grossTotal
        );
      }

      return first.playerId.localeCompare(
        second.playerId
      );
    }
  );
}

export function buildVerifiedLeaderboard(
  scorecardEntries: ScorecardEntry[]
): LeaderboardPlayer[] {
  return buildLeaderboard(
    scorecardEntries.filter(
      (entry) =>
        entry.status === 'verified'
    )
  );
}