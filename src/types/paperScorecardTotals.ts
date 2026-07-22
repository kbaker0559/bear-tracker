export type PaperPlayerTotals = {
  playerId: string;

  frontNineGross: number | null;
  backNineGross: number | null;
  grossTotal: number | null;

  frontNinePoints: number | null;
  backNinePoints: number | null;
  totalPoints: number | null;

  quota: number | null;
  quotaResult: number | null;
};