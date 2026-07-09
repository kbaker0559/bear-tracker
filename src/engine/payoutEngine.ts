import { league } from '../config/league';

export type PayoutSummary = {
  playerCount: number;
  entryFees: number;
  prizePool: number;
  holeInOneContribution: number;
};

export function calculatePayoutSummary(playerCount: number): PayoutSummary {
  const entryFees = playerCount * league.rules.entryFee;
  const holeInOneContribution =
    playerCount * league.rules.holeInOneContribution;

  return {
    playerCount,
    entryFees,
    holeInOneContribution,
    prizePool: entryFees - holeInOneContribution
  };
}