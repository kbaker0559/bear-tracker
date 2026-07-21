import type { RoundBundle } from '../engine/roundEngine';
import type { Group } from '../types';
import type { PlayerAccount } from '../types/playerAccount';

const STORAGE_KEY = 'glos-current-round';

export type SavedCurrentRound = {
  roundBundle: RoundBundle;
  groups: Group[];
  playerAccounts: PlayerAccount[];
};

export function loadCurrentRound(): SavedCurrentRound | null {
  try {
    const savedValue =
      window.localStorage.getItem(STORAGE_KEY);

    if (!savedValue) {
      return null;
    }

    const parsed =
      JSON.parse(savedValue) as SavedCurrentRound;

    return {
      ...parsed,

      roundBundle: {
        ...parsed.roundBundle,

        roundPlayers:
          parsed.roundBundle.roundPlayers ?? [],

        scorecards:
          parsed.roundBundle.scorecards ?? [],

        scorecardImports:
          parsed.roundBundle.scorecardImports ?? [],

        scorecardEntries:
          parsed.roundBundle.scorecardEntries ?? []
      },

      groups: parsed.groups ?? [],

      playerAccounts:
        parsed.playerAccounts ?? []
    };
  } catch (error) {
    console.error(
      'Could not load the saved GLOS round.',
      error
    );

    return null;
  }
}

export function saveCurrentRound(
  value: SavedCurrentRound
): void {
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(value)
    );
  } catch (error) {
    console.error(
      'Could not save the current GLOS round.',
      error
    );
  }
}

export function clearSavedCurrentRound(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}