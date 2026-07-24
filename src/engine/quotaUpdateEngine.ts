import type { RoundPlayer } from '../types/roundPlayer';
import type { ScorecardEntry } from '../types/scoreEntry';
import type { QuotaUpdate } from '../types/quotaUpdate';
import { calculateHorseAss } from './horseAssEngine';
import { calculatePlaces } from './placesEngine';
import {
  quotaDecreaseForResult,
  quotaIncreaseForCashingResult
} from './quota';

const NON_PARTICIPATING = new Set([
  'dns',
  'withdrawn',
  'no-show',
  'removed'
]);

/**
 * Black Bear quota-rule precedence:
 * 1. In-the-money players only increase when their quota result is positive.
 *    Even or negative in-the-money finishes do not change quota.
 * 2. Players outside the money never increase for a positive result.
 * 3. Negative results outside the money use the standard decrease chart.
 * 4. Horse's Ass winners use that same negative chart, but their decrease is
 *    capped at two points. The cap never forces a larger decrease.
 */
export function calculatedQuotaAdjustment(
  quotaResult: number,
  inMoney: boolean,
  isHorseAssWinner: boolean
): number {
  if (inMoney) {
    return quotaResult > 0
      ? quotaIncreaseForCashingResult(quotaResult)
      : 0;
  }

  if (quotaResult < 0) {
    const normalDecrease = quotaDecreaseForResult(quotaResult);
    return isHorseAssWinner
      ? Math.max(normalDecrease, -2)
      : normalDecrease;
  }

  return 0;
}

export function quotaRuleExplanation(
  quotaResult: number,
  inMoney: boolean,
  isHorseAssWinner: boolean
): string {
  if (inMoney) {
    if (quotaResult <= 0) {
      return 'In the money with an even or negative result: no quota change';
    }
    if (quotaResult <= 2) return '+1 to +2 in the money: quota increases by 1';
    if (quotaResult <= 4) return '+3 to +4 in the money: quota increases by 2';
    if (quotaResult <= 6) return '+5 to +6 in the money: quota increases by 3';
    if (quotaResult <= 9) return '+7 to +9 in the money: quota increases by 4';
    return '+10 or better in the money: quota increases by half the result, rounded up';
  }

  if (quotaResult >= 0) {
    return quotaResult === 0
      ? 'Even round: no quota change'
      : 'Positive round outside the money: no quota increase';
  }

  const normalDecrease = quotaDecreaseForResult(quotaResult);
  if (isHorseAssWinner && normalDecrease < -2) {
    return "Horse's Ass winner: standard decrease capped at 2 points";
  }

  if (quotaResult <= -10) return '-10 or worse: quota decreases by 4';
  if (quotaResult <= -6) return '-6 to -9: quota decreases by 3';
  if (quotaResult <= -3) return '-3 to -5: quota decreases by 2';
  return '-1 to -2: quota decreases by 1';
}

export function buildQuotaUpdates(
  roundId: string,
  roundPlayers: RoundPlayer[],
  scorecardEntries: ScorecardEntry[],
  existing: QuotaUpdate[] = []
): QuotaUpdate[] {
  const roundPlayerById = new Map(
    roundPlayers.map((player) => [player.playerId, player])
  );
  const inMoneyByPlayerId = new Map(
    calculatePlaces(roundPlayers, scorecardEntries).standings.map(
      (standing) => [standing.playerId, standing.inMoney]
    )
  );
  const horseAssWinnerIds = new Set(
    calculateHorseAss(roundPlayers, scorecardEntries).winners.map(
      (winner) => winner.playerId
    )
  );

  const previousByPlayerId = new Map(
    existing.map((update) => [update.playerId, update])
  );

  return scorecardEntries
    .filter((entry) => entry.status === 'verified')
    .flatMap((entry) => entry.players)
    .filter((entry) => {
      const roundPlayer = roundPlayerById.get(entry.playerId);
      return (
        roundPlayer !== undefined &&
        !NON_PARTICIPATING.has(roundPlayer.status) &&
        entry.grossTotal !== null &&
        entry.stablefordPoints !== null &&
        entry.quotaResult !== null
      );
    })
    .map((entry) => {
      const previous = previousByPlayerId.get(entry.playerId);
      const inMoney = inMoneyByPlayerId.get(entry.playerId) ?? false;
      const isHorseAssWinner = horseAssWinnerIds.has(entry.playerId);
      const adjustment = calculatedQuotaAdjustment(
        entry.quotaResult as number,
        inMoney,
        isHorseAssWinner
      );
      const oldQuota = entry.quota;
      const calculationUnchanged = Boolean(
        previous &&
        previous.oldQuota === oldQuota &&
        previous.quotaResult === entry.quotaResult &&
        previous.inMoney === inMoney &&
        previous.isHorseAssWinner === isHorseAssWinner &&
        previous.calculatedAdjustment === adjustment
      );
      const officialAdjustment =
        calculationUnchanged && previous?.overrideReason
          ? previous.officialAdjustment
          : adjustment;

      return {
        id: `quota:${roundId}:${entry.playerId}`,
        roundId,
        playerId: entry.playerId,
        oldQuota,
        quotaResult: entry.quotaResult as number,
        inMoney,
        isHorseAssWinner,
        calculatedAdjustment: adjustment,
        officialAdjustment,
        newQuota: Math.max(0, oldQuota + officialAdjustment),
        overrideReason:
          calculationUnchanged ? previous?.overrideReason : undefined,
        reviewed:
          calculationUnchanged ? previous?.reviewed ?? false : false,
        appliedAt:
          calculationUnchanged ? previous?.appliedAt : undefined
      };
    })
    .sort((a, b) => {
      if (a.quotaResult !== b.quotaResult) {
        return b.quotaResult - a.quotaResult;
      }
      return a.playerId.localeCompare(b.playerId);
    });
}
