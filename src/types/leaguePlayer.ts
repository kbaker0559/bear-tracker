export type PlayerAliasSource =
  | 'pairings'
  | 'ocr'
  | 'manual';

export type PlayerAlias = {
  value: string;
  source: PlayerAliasSource;
};

export type LeaguePlayer = {
  id: string;
  firstName: string;
  lastName: string;
  active: boolean;
  aliases: PlayerAlias[];
  ghin?: string;
  preferredTee?: string;
  notes?: string;
};

export function getLeaguePlayerName(
  player: LeaguePlayer
): string {
  return `${player.firstName} ${player.lastName}`.trim();
}