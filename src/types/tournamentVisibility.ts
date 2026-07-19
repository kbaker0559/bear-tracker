export type TournamentVisibilitySettings = {
  liveLeaderboardEnabled: boolean;
  liveSkinsEnabled: boolean;
  liveGreeniesEnabled: boolean;
  liveProjectedPayoutsEnabled: boolean;
  adminPreviewEnabled: boolean;
  publishResultsAfterVerification: boolean;
};

export const bearTrackerTournamentVisibility: TournamentVisibilitySettings = {
  liveLeaderboardEnabled: false,
  liveSkinsEnabled: false,
  liveGreeniesEnabled: false,
  liveProjectedPayoutsEnabled: false,
  adminPreviewEnabled: true,
  publishResultsAfterVerification: true
};