import type { LeagueScoringSettings } from '../types/scoringSettings';

export const bearTrackerScoringSettings: LeagueScoringSettings =
{
  handicapStrokeMode: 'max-one-per-hole',

  stableford: {
    doubleBogeyOrWorse: 0,
    bogey: 1,
    par: 2,
    birdie: 4,
    eagle: 6,
    doubleEagle: 8
  },

  liveLeaderboardEnabled: false,

  liveSkinsEnabled: false,

  quotasEnabled: true,

  netSkinsEnabled: true
};