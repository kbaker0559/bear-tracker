export type ContestPayoutOverride = {
  amount: number;
  reason?: string;
};

export type GreenieSelection = {
  decided: boolean;
  winnerId: string | null;
  winnerIds?: string[];
  distance?: string;
  notes?: string;
};

export type ResultsSettings = {
  placeTieGroupOverrides: Record<string, ContestPayoutOverride>;
  skinsPerWinnerOverride?: ContestPayoutOverride;
  greeniesPerWinnerOverride?: ContestPayoutOverride;
  greenieSelections: Record<string, GreenieSelection>;
  greenieAwardOverrides: Record<string, ContestPayoutOverride>;
  horseAssPerWinnerOverride?: ContestPayoutOverride;
};

export function createDefaultResultsSettings(): ResultsSettings {
  return {
    placeTieGroupOverrides: {},
    greenieSelections: {},
    greenieAwardOverrides: {}
  };
}
