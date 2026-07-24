export type TreasuryReconciliation = {
  tournamentPrizePotCount: number | null;
  holeInOnePotCount: number | null;
  oweEnvelopeCount: number | null;
  reconciledAt?: string;
};

export function createEmptyTreasuryReconciliation(): TreasuryReconciliation {
  return {
    tournamentPrizePotCount: null,
    holeInOnePotCount: null,
    oweEnvelopeCount: null
  };
}
