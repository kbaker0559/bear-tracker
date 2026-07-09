export const leagueRules = {
  entryFee: 25,
  holeInOneContribution: 1,

  greenies: {
    par3Holes: [3, 5, 11, 15],
    dollarsPerPlayer: 1,
    allowCarryForward: true,
    defaultRoundDownAmount: 20
  },

  skins: {
    useNetScores: true,
    tiesCancel: true,
    carryovers: false
  },

  horseAss: {
    amount: 10,
    quotaAdjustment: -2
  },

  places: {
    paidPlacesByPlayerCount: [
      { minPlayers: 9, places: 4 },
      { minPlayers: 16, places: 5 }
    ]
  },

  quotaAdjustments: {
    hAWinnerOverride: -2
  }
} as const;