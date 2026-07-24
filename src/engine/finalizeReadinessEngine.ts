import type { RoundBundle } from './roundEngine';
import { buildAwardEntries } from './awardEntryEngine';

export type FinalizeReadinessItem = {
  id: string;
  label: string;
  complete: boolean;
  workspace: 'operations' | 'tournament' | 'results' | 'finance' | 'quotas';
  detail?: string;
};

export type FinalizeReadiness = {
  ready: boolean;
  items: FinalizeReadinessItem[];
};

const NON_PARTICIPATING = new Set([
  'dns',
  'withdrawn',
  'no-show',
  'removed'
]);

export function getFinalizeReadiness(bundle: RoundBundle): FinalizeReadiness {
  const participatingPlayers = bundle.roundPlayers.filter(
    (player) => !NON_PARTICIPATING.has(player.status)
  );

  const allParticipantsAccountedFor = participatingPlayers.every(
    (player) => player.checkedIn && player.paid
  );

  const allScorecardsVerified =
    bundle.scorecardEntries.length > 0 &&
    bundle.scorecardEntries.every((entry) => entry.status === 'verified');

  const awardEntries = buildAwardEntries(
    bundle.round.id,
    bundle.roundPlayers,
    bundle.scorecardEntries,
    bundle.resultsSettings,
    bundle.awardEntries ?? []
  );

  const resultsCalculated = awardEntries.length > 0;
  const allAwardsSettled =
    resultsCalculated &&
    awardEntries.every((entry) => entry.settlementStatus !== 'unsettled');

  const treasuryBalanced = Boolean(
    bundle.treasuryReconciliation?.reconciledAt
  );

  const greeniesDecided = ['3', '5', '11', '15'].every(
    (hole) => bundle.resultsSettings.greenieSelections?.[hole]?.decided
  );

  const quotaUpdates = bundle.quotaUpdates ?? [];
  const quotasReviewed =
    quotaUpdates.length === participatingPlayers.length &&
    quotaUpdates.length > 0 &&
    quotaUpdates.every((update) => update.reviewed);

  const items: FinalizeReadinessItem[] = [
    {
      id: 'pairings',
      label: 'Pairings imported',
      complete: bundle.scorecards.length > 0,
      workspace: 'operations'
    },
    {
      id: 'arrivals',
      label: 'Every participating player checked in and paid',
      complete: participatingPlayers.length > 0 && allParticipantsAccountedFor,
      workspace: 'operations',
      detail: `${participatingPlayers.filter((player) => player.checkedIn && player.paid).length} of ${participatingPlayers.length}`
    },
    {
      id: 'scorecards',
      label: 'All scorecards verified',
      complete: allScorecardsVerified,
      workspace: 'tournament',
      detail: `${bundle.scorecardEntries.filter((entry) => entry.status === 'verified').length} of ${bundle.scorecardEntries.length}`
    },
    {
      id: 'results',
      label: 'Official award entries calculated',
      complete: resultsCalculated,
      workspace: 'results'
    },
    {
      id: 'greenies',
      label: 'All Greenie holes decided',
      complete: greeniesDecided,
      workspace: 'results'
    },
    {
      id: 'settlement',
      label: 'Every award settled',
      complete: allAwardsSettled,
      workspace: 'finance',
      detail: `${awardEntries.filter((entry) => entry.settlementStatus !== 'unsettled').length} of ${awardEntries.length}`
    },
    {
      id: 'treasury',
      label: 'Treasury reconciled and balanced',
      complete: treasuryBalanced,
      workspace: 'finance'
    },
    {
      id: 'quotas',
      label: 'Quota updates reviewed and ready',
      complete: quotasReviewed,
      workspace: 'quotas',
      detail: `${quotaUpdates.filter((update) => update.reviewed).length} of ${quotaUpdates.length}`
    }
  ];

  return {
    ready: items.every((item) => item.complete),
    items
  };
}
