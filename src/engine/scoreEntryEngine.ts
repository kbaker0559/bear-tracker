import type { Player } from '../types';
import type { CourseHole } from '../data/blackBearCourse';
import type { LeagueScoringSettings } from '../types/scoringSettings';
import type { Scorecard } from '../types/scorecard';
import type {
  HoleScore,
  PlayerScoreEntry,
  ScorecardEntry
} from '../types/scoreEntry';
import { calculateHoleResult } from './scoringEngine';

function createEmptyHoleScores(): HoleScore[] {
  return Array.from(
    { length: 18 },
    (_, index) => ({
      holeNumber: index + 1,
      grossScore: null,
      handicapStrokes: null,
      netScore: null,
      stablefordPoints: null
    })
  );
}

function createPlayerScoreEntry(
  playerId: string,
  courseHandicap: number,
  players: Player[]
): PlayerScoreEntry {
  const player = players.find(
    (candidate) => candidate.id === playerId
  );

  return {
    playerId,
    courseHandicap,
    quota: player?.quota ?? 0,

    scores: createEmptyHoleScores(),

    frontNineGrossTotal: null,
    backNineGrossTotal: null,
    grossTotal: null,

    frontNineNetTotal: null,
    backNineNetTotal: null,
    netTotal: null,

    frontNinePoints: null,
    backNinePoints: null,
    stablefordPoints: null,

    quotaResult: null
  };
}

export function createScorecardEntry(
  roundId: string,
  scorecard: Scorecard,
  players: Player[]
): ScorecardEntry {
  return {
    id: crypto.randomUUID(),
    roundId,
    scorecardId: scorecard.id,
    status: 'not-started',

    players: scorecard.players.map(
      (scorecardPlayer) =>
        createPlayerScoreEntry(
          scorecardPlayer.playerId,
          scorecardPlayer.handicapAtPairing,
          players
        )
    ),
    paperTotals: []
  };
}

function totalCompletedValues(
  values: Array<number | null>
): number | null {
  if (values.some((value) => value === null)) {
    return null;
  }

  return values.reduce<number>(
    (total, value) => total + (value ?? 0),
    0
  );
}

function recalculatePlayerTotals(
  playerEntry: PlayerScoreEntry
): PlayerScoreEntry {
  const frontNine = playerEntry.scores.filter(
    (score) => score.holeNumber <= 9
  );

  const backNine = playerEntry.scores.filter(
    (score) => score.holeNumber >= 10
  );

  const frontNineGrossTotal =
    totalCompletedValues(
      frontNine.map((score) => score.grossScore)
    );

  const backNineGrossTotal =
    totalCompletedValues(
      backNine.map((score) => score.grossScore)
    );

  const grossTotal =
    totalCompletedValues(
      playerEntry.scores.map(
        (score) => score.grossScore
      )
    );

  const frontNineNetTotal =
    totalCompletedValues(
      frontNine.map((score) => score.netScore)
    );

  const backNineNetTotal =
    totalCompletedValues(
      backNine.map((score) => score.netScore)
    );

  const netTotal =
    totalCompletedValues(
      playerEntry.scores.map(
        (score) => score.netScore
      )
    );

  const frontNinePoints =
    totalCompletedValues(
      frontNine.map(
        (score) => score.stablefordPoints
      )
    );

  const backNinePoints =
    totalCompletedValues(
      backNine.map(
        (score) => score.stablefordPoints
      )
    );

  const stablefordPoints =
    totalCompletedValues(
      playerEntry.scores.map(
        (score) => score.stablefordPoints
      )
    );

  const quotaResult =
    stablefordPoints !== null
      ? stablefordPoints - playerEntry.quota
      : null;

  return {
    ...playerEntry,

    frontNineGrossTotal,
    backNineGrossTotal,
    grossTotal,

    frontNineNetTotal,
    backNineNetTotal,
    netTotal,

    frontNinePoints,
    backNinePoints,
    stablefordPoints,

    quotaResult
  };
}

export function updateGrossScore(
  scorecardEntry: ScorecardEntry,
  playerId: string,
  holeNumber: number,
  grossScore: number | null,
  course: CourseHole[],
  settings: LeagueScoringSettings
): ScorecardEntry {
  if (holeNumber < 1 || holeNumber > 18) {
    throw new Error(
      'Hole number must be between 1 and 18.'
    );
  }

  if (
    grossScore !== null &&
    (!Number.isInteger(grossScore) ||
      grossScore < 1 ||
      grossScore > 20)
  ) {
    throw new Error(
      'Gross score must be a whole number between 1 and 20.'
    );
  }

  const hole = course.find(
    (candidate) =>
      candidate.holeNumber === holeNumber
  );

  if (!hole) {
    throw new Error(
      `Course information for hole ${holeNumber} could not be found.`
    );
  }

  const players = scorecardEntry.players.map(
    (playerEntry) => {
      if (playerEntry.playerId !== playerId) {
        return playerEntry;
      }

      const scores = playerEntry.scores.map(
        (score) => {
          if (score.holeNumber !== holeNumber) {
            return score;
          }

          if (grossScore === null) {
            return {
              ...score,
              grossScore: null,
              handicapStrokes: null,
              netScore: null,
              stablefordPoints: null
            };
          }

          const result = calculateHoleResult(
            {
              grossScore,
              par: hole.par,
              strokeIndex: hole.strokeIndex,
              courseHandicap:
                playerEntry.courseHandicap
            },
            settings
          );

          return {
            ...score,
            grossScore: result.grossScore,
            handicapStrokes:
              result.handicapStrokes,
            netScore: result.netScore,
            stablefordPoints:
              result.stablefordPoints
          };
        }
      );

      return recalculatePlayerTotals({
        ...playerEntry,
        scores
      });
    }
  );

  const anyScoreEntered = players.some(
    (playerEntry) =>
      playerEntry.scores.some(
        (score) => score.grossScore !== null
      )
  );

  const everyScoreEntered = players.every(
    (playerEntry) =>
      playerEntry.scores.every(
        (score) => score.grossScore !== null
      )
  );

  return {
    ...scorecardEntry,
    players,

    status: everyScoreEntered
      ? 'complete'
      : anyScoreEntered
        ? 'in-progress'
        : 'not-started',

    startedAt: anyScoreEntered
      ? scorecardEntry.startedAt ??
        new Date().toISOString()
      : undefined,

    completedAt: everyScoreEntered
      ? scorecardEntry.completedAt ??
        new Date().toISOString()
      : undefined,

    verifiedAt: everyScoreEntered
      ? scorecardEntry.verifiedAt
      : undefined
  };
}

export function isScorecardEntryComplete(
  scorecardEntry: ScorecardEntry
): boolean {
  return scorecardEntry.players.every(
    (playerEntry) =>
      playerEntry.scores.every(
        (score) => score.grossScore !== null
      )
  );
}

export function markScorecardEntryVerified(
  scorecardEntry: ScorecardEntry
): ScorecardEntry {
  if (!isScorecardEntryComplete(scorecardEntry)) {
    throw new Error(
      'All 18 gross scores must be entered for every player before verification.'
    );
  }

  return {
    ...scorecardEntry,
    status: 'verified',
    verifiedAt: new Date().toISOString()
  };
}