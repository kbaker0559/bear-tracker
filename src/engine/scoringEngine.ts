import type { LeagueScoringSettings } from '../types/scoringSettings';

export type HoleScoringInput = {
  grossScore: number;
  par: number;
  strokeIndex: number;
  courseHandicap: number;
};

export type HoleScoringResult = {
  grossScore: number;
  handicapStrokes: number;
  netScore: number;
  scoreToPar: number;
  stablefordPoints: number;
};

export function calculateHandicapStrokes(
  courseHandicap: number,
  strokeIndex: number,
  settings: LeagueScoringSettings
): number {
  if (
    !Number.isInteger(courseHandicap) ||
    courseHandicap < 0
  ) {
    throw new Error(
      'Course handicap must be a whole number of zero or greater.'
    );
  }

  if (
    !Number.isInteger(strokeIndex) ||
    strokeIndex < 1 ||
    strokeIndex > 18
  ) {
    throw new Error(
      'Stroke index must be a whole number from 1 through 18.'
    );
  }

  if (
    settings.handicapStrokeMode ===
    'max-one-per-hole'
  ) {
    const cappedHandicap = Math.min(
      courseHandicap,
      18
    );

    return strokeIndex <= cappedHandicap
      ? 1
      : 0;
  }

  const fullRounds = Math.floor(
    courseHandicap / 18
  );

  const remainingStrokes =
    courseHandicap % 18;

  return (
    fullRounds +
    (strokeIndex <= remainingStrokes ? 1 : 0)
  );
}

export function calculateStablefordPoints(
  grossScore: number,
  par: number,
  settings: LeagueScoringSettings
): number {
  const scoreToPar = grossScore - par;

  if (scoreToPar >= 2) {
    return settings.stableford.doubleBogeyOrWorse;
  }

  if (scoreToPar === 1) {
    return settings.stableford.bogey;
  }

  if (scoreToPar === 0) {
    return settings.stableford.par;
  }

  if (scoreToPar === -1) {
    return settings.stableford.birdie;
  }

  if (scoreToPar === -2) {
    return settings.stableford.eagle;
  }

  return settings.stableford.doubleEagle;
}

export function calculateHoleResult(
  input: HoleScoringInput,
  settings: LeagueScoringSettings
): HoleScoringResult {
  if (
    !Number.isInteger(input.grossScore) ||
    input.grossScore < 1 ||
    input.grossScore > 20
  ) {
    throw new Error(
      'Gross score must be a whole number between 1 and 20.'
    );
  }

  if (
    !Number.isInteger(input.par) ||
    input.par < 3 ||
    input.par > 6
  ) {
    throw new Error(
      'Par must be a whole number between 3 and 6.'
    );
  }

  const handicapStrokes =
    calculateHandicapStrokes(
      input.courseHandicap,
      input.strokeIndex,
      settings
    );

  const netScore =
    input.grossScore - handicapStrokes;

  const scoreToPar =
    input.grossScore - input.par;

  const stablefordPoints =
    calculateStablefordPoints(
      input.grossScore,
      input.par,
      settings
    );

  return {
    grossScore: input.grossScore,
    handicapStrokes,
    netScore,
    scoreToPar,
    stablefordPoints
  };
}