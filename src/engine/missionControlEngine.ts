import type { Player } from '../types';
import type { AwardCategory } from '../types/awardEntry';
import type { RoundBundle } from './roundEngine';
import type { NavigationSection } from '../types/navigation';
import { buildAwardEntries } from './awardEntryEngine';
import { getFinalizeReadiness } from './finalizeReadinessEngine';

export type MissionWorkspace =
  | 'operations'
  | 'tournament'
  | 'results'
  | 'finance'
  | 'quotas'
  | 'finalize';

export type MissionStageId =
  | 'setup'
  | 'arrivals'
  | 'scoring'
  | 'results'
  | 'treasurer'
  | 'quotas'
  | 'finalize';

export type MissionStageStatus = 'complete' | 'in-progress' | 'not-started';

export type MissionStage = {
  id: MissionStageId;
  label: string;
  status: MissionStageStatus;
  detail?: string;
};

export type MissionAlert = {
  id: string;
  message: string;
  workspace: MissionWorkspace;
  section?: NavigationSection;
};

export type MissionControl = {
  statusLabel: string;
  stageLabel: string;
  progressPercent: number;
  nextActionLabel: string;
  nextActionDetail: string;
  nextWorkspace: MissionWorkspace;
  nextSection?: NavigationSection;
  stages: MissionStage[];
  alerts: MissionAlert[];
  snapshot: {
    participatingPlayers: number;
    checkedInPlayers: number;
    verifiedScorecards: number;
    totalScorecards: number;
    leaderName?: string;
    leaderResult?: number;
    skins: number;
    greenies: number;
    outstandingAwards: number;
    treasuryLabel: string;
  };
};

const NON_PARTICIPATING = new Set([
  'dns',
  'withdrawn',
  'no-show',
  'removed'
]);

function categoryLabel(category: AwardCategory): string {
  switch (category) {
    case 'greenie':
      return 'Greenies';
    case 'place':
    case 'horse-ass':
      return "Places & Horse's Ass";
    case 'skin':
      return 'Skins';
  }
}

function formatQuotaResult(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

export function getMissionControl(
  bundle: RoundBundle,
  players: Player[]
): MissionControl {
  const finalized = Boolean(bundle.round.finalizedAt);
  const activePlayers = bundle.roundPlayers.filter(
    (player) => !NON_PARTICIPATING.has(player.status)
  );
  const accountedPlayers = activePlayers.filter(
    (player) => player.checkedIn && player.paid
  );
  const activeLeaguePlayers = players.filter((player) => player.active);
  const reviewedLeagueIds = new Set(bundle.round.weeklyReviewedPlayerIds ?? []);
  const reviewedPlayers = activeLeaguePlayers.filter((player) =>
    reviewedLeagueIds.has(player.id)
  );
  const verifiedScorecards = bundle.scorecardEntries.filter(
    (entry) => entry.status === 'verified'
  );
  const allScorecardsVerified =
    bundle.scorecardEntries.length > 0 &&
    verifiedScorecards.length === bundle.scorecardEntries.length;

  const awardEntries = buildAwardEntries(
    bundle.round.id,
    bundle.roundPlayers,
    bundle.scorecardEntries,
    bundle.resultsSettings,
    bundle.awardEntries ?? []
  );
  const unsettledAwards = awardEntries.filter(
    (entry) => entry.settlementStatus === 'unsettled'
  );
  const greeniesDecided = ['3', '5', '11', '15'].every(
    (hole) => bundle.resultsSettings.greenieSelections?.[hole]?.decided
  );
  const resultsComplete =
    allScorecardsVerified && awardEntries.length > 0 && greeniesDecided;
  const settlementComplete =
    awardEntries.length > 0 && unsettledAwards.length === 0;
  const treasuryBalanced = Boolean(
    bundle.treasuryReconciliation?.reconciledAt
  );
  const readiness = getFinalizeReadiness(bundle);
  const quotaUpdates = bundle.quotaUpdates ?? [];
  const quotasReviewed =
    quotaUpdates.length === activePlayers.length &&
    quotaUpdates.length > 0 &&
    quotaUpdates.every((update) => update.reviewed);

  const setupComplete =
    bundle.scorecards.length > 0 &&
    activePlayers.length > 0 &&
    reviewedPlayers.length === activeLeaguePlayers.length;
  const playerStatusReviewed = Boolean(bundle.round.playerStatusReviewedAt);
  const cardOrderReviewed = Boolean(bundle.round.cardOrderReviewedAt);
  const arrivalsComplete =
    activePlayers.length > 0 &&
    accountedPlayers.length === activePlayers.length;
  const scoringStarted = bundle.scorecardEntries.some((entry) =>
    entry.players.some((player) =>
      player.scores.some((score) => score.grossScore !== null)
    )
  );
  const resultsStarted = allScorecardsVerified;
  const treasurerStarted = awardEntries.some(
    (entry) => entry.settlementStatus !== 'unsettled'
  );

  const stages: MissionStage[] = [
    {
      id: 'setup',
      label: 'Setup',
      status: setupComplete && playerStatusReviewed && cardOrderReviewed
        ? 'complete'
        : 'in-progress',
      detail:
        bundle.scorecards.length === 0
          ? 'Pairings not imported'
          : reviewedPlayers.length < activePlayers.length
            ? `${reviewedPlayers.length} of ${activePlayers.length} players reviewed`
            : !playerStatusReviewed
              ? 'Saturday player status review pending'
              : !cardOrderReviewed
                ? 'Final scorecard order pending'
                : 'Saturday preparation complete'
    },
    {
      id: 'arrivals',
      label: 'Arrivals',
      status: arrivalsComplete
        ? 'complete'
        : setupComplete && playerStatusReviewed && cardOrderReviewed
          ? 'in-progress'
          : 'not-started',
      detail: `${accountedPlayers.length} of ${activePlayers.length} complete`
    },
    {
      id: 'scoring',
      label: 'Scoring',
      status: allScorecardsVerified
        ? 'complete'
        : scoringStarted || arrivalsComplete
          ? 'in-progress'
          : 'not-started',
      detail: `${verifiedScorecards.length} of ${bundle.scorecardEntries.length} verified`
    },
    {
      id: 'results',
      label: 'Results',
      status: resultsComplete
        ? 'complete'
        : resultsStarted
          ? 'in-progress'
          : 'not-started',
      detail: greeniesDecided ? 'Awards calculated' : 'Greenies need decisions'
    },
    {
      id: 'treasurer',
      label: 'Treasurer',
      status: settlementComplete && treasuryBalanced
        ? 'complete'
        : treasurerStarted || resultsComplete
          ? 'in-progress'
          : 'not-started',
      detail:
        unsettledAwards.length > 0
          ? `${unsettledAwards.length} awards unresolved`
          : treasuryBalanced
            ? 'Treasury balanced'
            : 'Cash count pending'
    },
    {
      id: 'quotas',
      label: 'Quota Updates',
      status: quotasReviewed
        ? 'complete'
        : treasuryBalanced
          ? 'in-progress'
          : 'not-started',
      detail: `${quotaUpdates.filter((update) => update.reviewed).length} of ${quotaUpdates.length} reviewed`
    },
    {
      id: 'finalize',
      label: 'Finalize',
      status: finalized
        ? 'complete'
        : readiness.ready
          ? 'in-progress'
          : 'not-started',
      detail: finalized ? 'Tournament complete' : readiness.ready ? 'Ready' : 'Not ready'
    }
  ];

  let stageLabel = 'Tournament Setup';
  let nextActionLabel = 'Import Pairings';
  let nextActionDetail = 'Create the round and import the official pairings.';
  let nextWorkspace: MissionWorkspace = 'operations';
  let nextSection: NavigationSection | undefined = 'pairings-import';

  if (finalized) {
    stageLabel = 'Tournament Complete';
    nextActionLabel = 'Review Finalized Tournament';
    nextActionDetail = 'Treasury balanced and tournament archived. See you next Saturday.';
    nextWorkspace = 'finalize';
    nextSection = 'finalize';
  } else if (bundle.scorecards.length === 0) {
    stageLabel = 'Tournament Setup';
    nextSection = 'pairings-import';
  } else if (!setupComplete) {
    stageLabel = 'Friday Preparation';
    nextActionLabel = 'Review Handicaps & Quotas';
    nextActionDetail = `${activePlayers.length - reviewedPlayers.length} player${activePlayers.length - reviewedPlayers.length === 1 ? '' : 's'} still need review.`;
    nextSection = 'weekly-review';
  } else if (!playerStatusReviewed) {
    stageLabel = 'Saturday Morning Preparation';
    nextActionLabel = 'Review Player Status';
    nextActionDetail = 'Add or remove players and make any final card-assignment changes.';
    nextSection = 'player-status';
  } else if (!cardOrderReviewed) {
    stageLabel = 'Saturday Morning Preparation';
    nextActionLabel = 'Reorganize Scorecard Order';
    nextActionDetail = 'Arrange each card to match the names as they will appear on the paper scorecard.';
    nextSection = 'card-order';
  } else if (!arrivalsComplete) {
    stageLabel = 'Player Arrivals';
    nextActionLabel = 'Continue Player Arrivals';
    nextActionDetail = `${activePlayers.length - accountedPlayers.length} player${activePlayers.length - accountedPlayers.length === 1 ? '' : 's'} still need check-in or payment.`;
    nextSection = 'arrivals';
  } else if (!allScorecardsVerified) {
    stageLabel = 'Score Entry';
    const nextCard = bundle.scorecardEntries.find(
      (entry) => entry.status !== 'verified'
    );
    nextActionLabel = nextCard
      ? `Enter or Verify Card ${bundle.scorecards.find((card) => card.id === nextCard.scorecardId)?.cardNumber ?? ''}`.trim()
      : 'Continue Score Entry';
    nextActionDetail = `${bundle.scorecardEntries.length - verifiedScorecards.length} scorecard${bundle.scorecardEntries.length - verifiedScorecards.length === 1 ? '' : 's'} remaining.`;
    nextWorkspace = 'tournament';
    nextSection = nextCard
      ? `scorecard-${bundle.scorecards.find((card) => card.id === nextCard.scorecardId)?.cardNumber ?? 1}`
      : 'scorecard-queue';
  } else if (!resultsComplete) {
    stageLabel = 'Official Results';
    nextActionLabel = greeniesDecided ? 'Review Official Results' : 'Complete Greenies';
    nextActionDetail = greeniesDecided
      ? 'Review places, skins, Greenies, and Horse\'s Ass.'
      : 'Select a winner or No Winner for every Greenie hole.';
    nextWorkspace = 'results';
    nextSection = greeniesDecided ? 'results' : 'results-greenies';
  } else if (!settlementComplete) {
    stageLabel = 'Treasurer Settlement';
    const priority: AwardCategory[] = ['greenie', 'place', 'horse-ass', 'skin'];
    const nextCategory = priority.find((category) =>
      unsettledAwards.some((entry) => entry.category === category)
    );
    const categoryEntries = nextCategory
      ? unsettledAwards.filter((entry) => entry.category === nextCategory)
      : unsettledAwards;
    nextActionLabel = nextCategory
      ? `Pay ${categoryLabel(nextCategory)}`
      : 'Settle Awards';
    nextActionDetail = `${categoryEntries.length} payment${categoryEntries.length === 1 ? '' : 's'} remaining in this group.`;
    nextWorkspace = 'finance';
    nextSection = nextCategory === 'greenie' ? 'finance-greenies' : 'settlement';
  } else if (!treasuryBalanced) {
    stageLabel = 'Count Cash';
    nextActionLabel = 'Reconcile Treasury';
    nextActionDetail = 'Count the Tournament Prize Pot, Hole-in-One Pot, and Owe envelope.';
    nextWorkspace = 'finance';
    nextSection = 'cash-count';
  } else if (!quotasReviewed) {
    stageLabel = 'Quota Review';
    nextActionLabel = 'Review Quota Updates';
    nextActionDetail = `${quotaUpdates.filter((update) => !update.reviewed).length} quota update${quotaUpdates.filter((update) => !update.reviewed).length === 1 ? '' : 's'} still need review.`;
    nextWorkspace = 'quotas';
    nextSection = 'quota-review';
  } else {
    stageLabel = 'Ready to Finalize';
    nextActionLabel = 'Finalize Tournament';
    nextActionDetail = 'All readiness checks are complete.';
    nextWorkspace = 'finalize';
    nextSection = 'finalize';
  }

  const alerts: MissionAlert[] = [];
  if (bundle.scorecards.length > 0 && reviewedPlayers.length < activePlayers.length) {
    alerts.push({
      id: 'weekly-review',
      message: `${activePlayers.length - reviewedPlayers.length} handicap/quota review${activePlayers.length - reviewedPlayers.length === 1 ? '' : 's'} remaining.`,
      workspace: 'operations',
      section: 'weekly-review'
    });
  }
  if (activePlayers.length > accountedPlayers.length) {
    alerts.push({
      id: 'arrivals',
      message: `${activePlayers.length - accountedPlayers.length} participating player${activePlayers.length - accountedPlayers.length === 1 ? '' : 's'} not fully checked in and paid.`,
      workspace: 'operations',
      section: 'arrivals'
    });
  }
  if (bundle.scorecardEntries.length > verifiedScorecards.length) {
    alerts.push({
      id: 'scorecards',
      message: `${bundle.scorecardEntries.length - verifiedScorecards.length} scorecard${bundle.scorecardEntries.length - verifiedScorecards.length === 1 ? '' : 's'} not verified.`,
      workspace: 'tournament',
      section: 'scorecard-queue'
    });
  }
  if (allScorecardsVerified && !greeniesDecided) {
    alerts.push({
      id: 'greenies',
      message: 'One or more Greenie holes still need a winner or No Winner decision.',
      workspace: 'results',
      section: 'results'
    });
  }
  if (unsettledAwards.length > 0) {
    alerts.push({
      id: 'awards',
      message: `${unsettledAwards.length} award payment${unsettledAwards.length === 1 ? '' : 's'} remain unresolved.`,
      workspace: 'finance',
      section: 'settlement'
    });
  }

  if (treasuryBalanced && !quotasReviewed) {
    alerts.push({
      id: 'quota-review',
      message: `${quotaUpdates.filter((update) => !update.reviewed).length} quota update${quotaUpdates.filter((update) => !update.reviewed).length === 1 ? '' : 's'} still need review.`,
      workspace: 'quotas',
      section: 'quota-review'
    });
  }

  const outstandingCredit = bundle.roundPlayers.reduce(
    (sum, player) => sum + Math.max(0, player.creditApplied ?? 0),
    0
  );
  if (outstandingCredit > 0) {
    alerts.push({
      id: 'credits',
      message: `$${outstandingCredit} in league credit was applied to this round.`,
      workspace: 'finance',
      section: 'cash-count'
    });
  }
  if (settlementComplete && !treasuryBalanced) {
    alerts.push({
      id: 'treasury',
      message: 'Awards are settled, but Treasury Reconciliation is not complete.',
      workspace: 'finance'
    });
  }

  const completedStages = stages.filter((stage) => stage.status === 'complete').length;
  const inProgressBonus = stages.some((stage) => stage.status === 'in-progress') ? 0.5 : 0;
  const progressPercent = finalized
    ? 100
    : Math.min(99, Math.round(((completedStages + inProgressBonus) / stages.length) * 100));

  const leaderboard = bundle.scorecardEntries
    .flatMap((entry) => entry.players)
    .filter((entry) => entry.quotaResult !== null)
    .sort((a, b) => (b.quotaResult ?? -Infinity) - (a.quotaResult ?? -Infinity));
  const leader = leaderboard[0];
  const leaderProfile = leader
    ? players.find((player) => player.id === leader.playerId)
    : undefined;

  return {
    statusLabel: finalized ? 'Finalized' : 'In Progress',
    stageLabel,
    progressPercent,
    nextActionLabel,
    nextActionDetail,
    nextWorkspace,
    nextSection,
    stages,
    alerts,
    snapshot: {
      participatingPlayers: activePlayers.length,
      checkedInPlayers: accountedPlayers.length,
      verifiedScorecards: verifiedScorecards.length,
      totalScorecards: bundle.scorecardEntries.length,
      leaderName: leaderProfile?.name,
      leaderResult: leader?.quotaResult ?? undefined,
      skins: awardEntries.filter((entry) => entry.category === 'skin').length,
      greenies: awardEntries.filter((entry) => entry.category === 'greenie').length,
      outstandingAwards: unsettledAwards.length,
      treasuryLabel: treasuryBalanced ? 'Balanced' : settlementComplete ? 'Count Cash' : 'Not Ready'
    }
  };
}

export { formatQuotaResult };
