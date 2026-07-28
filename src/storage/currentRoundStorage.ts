import type { RoundBundle } from '../engine/roundEngine';
import type { Group, Player } from '../types';
import type { PlayerAccount } from '../types/playerAccount';
import { createDefaultResultsSettings } from '../types/resultsSettings';
import { createEmptyTreasuryReconciliation } from '../types/treasuryReconciliation';

const STORAGE_KEY = 'glos-current-round';
const SAVED_AT_KEY = 'glos-current-round-saved-at';

export type SavedCurrentRound = {
  roundBundle: RoundBundle;
  groups: Group[];
  playerAccounts: PlayerAccount[];
  leaguePlayers?: Player[];
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
  (
    parsed.roundBundle.scorecardEntries ?? []
  ).map((entry) => ({
    ...entry,
    paperTotals:
      entry.paperTotals ?? []
  })),
        scoreCorrections:
          parsed.roundBundle.scoreCorrections ?? [],

        tournamentEvents:
          parsed.roundBundle.tournamentEvents ?? [],

        resultsSettings: {
          ...createDefaultResultsSettings(),
          ...(parsed.roundBundle.resultsSettings ?? {}),
          placeTieGroupOverrides:
            parsed.roundBundle.resultsSettings?.placeTieGroupOverrides ?? {},
          greenieSelections:
            parsed.roundBundle.resultsSettings?.greenieSelections ?? {},
          greenieAwardOverrides:
            parsed.roundBundle.resultsSettings?.greenieAwardOverrides ?? {}
        },

        awardEntries:
          parsed.roundBundle.awardEntries ?? [],

        treasuryTransactions:
          parsed.roundBundle.treasuryTransactions ?? [],

        treasuryReconciliation: {
          ...createEmptyTreasuryReconciliation(),
          ...(parsed.roundBundle.treasuryReconciliation ?? {})
        },

        quotaUpdates:
          parsed.roundBundle.quotaUpdates ?? []
      },

      groups: parsed.groups ?? [],

      playerAccounts:
        parsed.playerAccounts ?? [],

      leaguePlayers:
        parsed.leaguePlayers
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
): string | null {
  try {
    // Image data URLs can exceed the browser's localStorage quota.
    // Persist the complete tournament setup and OCR state, but omit the
    // bulky photo bytes so a restart never loses pairings/check-in progress.
    const safeValue: SavedCurrentRound = {
      ...value,
      roundBundle: {
        ...value.roundBundle,
        scorecardImports: value.roundBundle.scorecardImports.map((item) => ({
          ...item,
          imageUrl: undefined,
          originalImageUrl: undefined
        }))
      }
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(safeValue));
    const savedAt = new Date().toISOString();
    window.localStorage.setItem(SAVED_AT_KEY, savedAt);
    return savedAt;
  } catch (error) {
    console.error('Could not save the current GLOS round.', error);
    return null;
  }
}

export function loadCurrentRoundSavedAt(): string | null {
  return window.localStorage.getItem(SAVED_AT_KEY);
}

export function clearSavedCurrentRound(): void {
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(SAVED_AT_KEY);
}