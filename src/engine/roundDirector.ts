import type { RoundState } from '../types/currentRound';
import type { RoundBundle } from './roundEngine';

export type RoundNextAction =
  | 'set-up-round'
  | 'open-registration'
  | 'continue-registration'
  | 'resolve-missing-players'
  | 'start-round'
  | 'continue-scoring'
  | 'review-scores'
  | 'continue-payouts'
  | 'reconcile-cash'
  | 'view-history';

export type RoundGuidance = {
  state: RoundState;
  phaseLabel: string;
  nextAction: RoundNextAction;
  actionLabel: string;
  message: string;
  progressPercent: number;
  waitingCount: number;
};

export function recommendRoundState(
  bundle: RoundBundle
): RoundState {
  const {
    expectedPlayerCount,
    checkedInCount,
    paidCount,
    scorecardCount,
    state
  } = bundle.round;

  if (state === 'archived') {
    return 'archived';
  }

  if (
    state === 'round-live' ||
    state === 'scoring-complete' ||
    state === 'payouts' ||
    state === 'financial-closeout'
  ) {
    return state;
  }

  if (
    scorecardCount === 0 ||
    expectedPlayerCount === 0
  ) {
    return 'planning';
  }

  const registrationStarted =
    state === 'registration-open' ||
    state === 'registration-closing' ||
    state === 'ready-to-start' ||
    checkedInCount > 0 ||
    paidCount > 0;

  if (!registrationStarted) {
    return 'pairings-ready';
  }

  const everyoneArrived =
    checkedInCount === expectedPlayerCount;

  const everyEntrySatisfied =
    paidCount === expectedPlayerCount;

  if (everyoneArrived && everyEntrySatisfied) {
    return 'ready-to-start';
  }

  return 'registration-open';
}

export function getRoundGuidance(
  bundle: RoundBundle
): RoundGuidance {
  const state = recommendRoundState(bundle);

  const {
    expectedPlayerCount,
    checkedInCount
  } = bundle.round;

  const waitingCount = Math.max(
    expectedPlayerCount - checkedInCount,
    0
  );

  const progressPercent =
    expectedPlayerCount > 0
      ? Math.round(
          (checkedInCount / expectedPlayerCount) * 100
        )
      : 0;

  switch (state) {
    case 'planning':
      return {
        state,
        phaseLabel: 'Planning',
        nextAction: 'set-up-round',
        actionLabel: 'Set Up Round',
        message:
          'Import and review the pairings for the upcoming round.',
        progressPercent,
        waitingCount
      };

    case 'pairings-ready':
      return {
        state,
        phaseLabel: 'Pairings Ready',
        nextAction: 'open-registration',
        actionLabel: 'Open Registration',
        message:
          `${expectedPlayerCount} players and ` +
          `${bundle.round.scorecardCount} scorecards are ready.`,
        progressPercent,
        waitingCount
      };

    case 'registration-open':
      return {
        state,
        phaseLabel: 'Registration Open',
        nextAction: 'continue-registration',
        actionLabel: 'Continue Registration',
        message:
          `${waitingCount} player${
            waitingCount === 1 ? '' : 's'
          } still waiting.`,
        progressPercent,
        waitingCount
      };

    case 'registration-closing':
      return {
        state,
        phaseLabel: 'Registration Closing',
        nextAction: 'resolve-missing-players',
        actionLabel: 'Resolve Missing Players',
        message:
          `${waitingCount} player${
            waitingCount === 1 ? '' : 's'
          } still need attention.`,
        progressPercent,
        waitingCount
      };

    case 'ready-to-start':
      return {
        state,
        phaseLabel: 'Ready to Tee Off',
        nextAction: 'start-round',
        actionLabel: 'Start Round',
        message:
          'Every expected player has arrived and satisfied the entry.',
        progressPercent,
        waitingCount
      };

    case 'round-live':
      return {
        state,
        phaseLabel: 'Round in Progress',
        nextAction: 'continue-scoring',
        actionLabel: 'Continue Scoring',
        message:
          'The round is underway.',
        progressPercent,
        waitingCount
      };

    case 'scoring-complete':
      return {
        state,
        phaseLabel: 'Scoring Complete',
        nextAction: 'review-scores',
        actionLabel: 'Review Scores',
        message:
          'Review the completed scorecards before calculating payouts.',
        progressPercent,
        waitingCount
      };

    case 'payouts':
      return {
        state,
        phaseLabel: 'Payouts',
        nextAction: 'continue-payouts',
        actionLabel: 'Continue Payouts',
        message:
          'Complete places, skins, greenies, and other payouts.',
        progressPercent,
        waitingCount
      };

    case 'financial-closeout':
      return {
        state,
        phaseLabel: 'Financial Closeout',
        nextAction: 'reconcile-cash',
        actionLabel: 'Reconcile Cash',
        message:
          'Verify the envelopes and player balances.',
        progressPercent,
        waitingCount
      };

    case 'archived':
      return {
        state,
        phaseLabel: 'Archived',
        nextAction: 'view-history',
        actionLabel: 'View Round History',
        message:
          'This round is complete and read-only.',
        progressPercent,
        waitingCount
      };
  }
}