export type NavigationSection =
  | 'pairings-import'
  | 'weekly-review'
  | 'player-status'
  | 'card-order'
  | 'arrivals'
  | 'scorecard-queue'
  | `scorecard-${number}`
  | 'results'
  | 'results-greenies'
  | 'settlement'
  | 'finance-greenies'
  | 'cash-count'
  | 'quota-review'
  | 'finalize';

export type WorkspaceNavigation = {
  workspace:
    | 'operations'
    | 'tournament'
    | 'results'
    | 'finance'
    | 'quotas'
    | 'finalize';
  section?: NavigationSection;
};
