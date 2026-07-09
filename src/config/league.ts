import { leagueRules } from './leagueRules';

export const league = {
  name: 'Black Bear Saturday Game',

  course: {
    name: 'Black Bear Golf Club',
    par: 72
  },

  rules: leagueRules
} as const;