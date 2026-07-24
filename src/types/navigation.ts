export type NavigationSection =
  | 'pairings-import'
  | 'weekly-review'
  | 'card-order'
  | 'arrivals'
  | 'scorecard-queue'
  | `scorecard-${number}`
  | 'results'
  | 'settlement'
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
