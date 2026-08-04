export type PlayerAliasSource =
  | 'pairings'
  | 'ocr'
  | 'manual'
  | 'generated';

export type PlayerAlias = {
  value: string;
  source: PlayerAliasSource;
};
import type { Tee } from './tee';
export type LeaguePlayer = {
  id: string;
  firstName: string;
  lastName: string;
  active: boolean;
  aliases: PlayerAlias[];
  preferredTee?: Tee;
  notes?: string;
};

export function getLeaguePlayerName(
  player: LeaguePlayer
): string {
  return `${player.firstName} ${player.lastName}`.trim();
}