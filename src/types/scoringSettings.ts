export type HandicapStrokeMode =
  | 'max-one-per-hole'
  | 'full-course-handicap';

export type StablefordPointValues = {
  doubleBogeyOrWorse: number;
  bogey: number;
  par: number;
  birdie: number;
  eagle: number;
  doubleEagle: number;
};

export type LeagueScoringSettings = {
  handicapStrokeMode: HandicapStrokeMode;

  stableford: StablefordPointValues;

  liveLeaderboardEnabled: boolean;

  liveSkinsEnabled: boolean;

  quotasEnabled: boolean;

  netSkinsEnabled: boolean;
};