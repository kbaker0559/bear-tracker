import type { AwardEntry } from '../types/awardEntry';
import type { RoundPlayer } from '../types/roundPlayer';
import type { ScorecardEntry } from '../types/scoreEntry';
import type { ResultsSettings } from '../types/resultsSettings';
import { calculatePlaces } from './placesEngine';
import { calculateSkins } from './skinsEngine';
import { calculateGreenies } from './greeniesEngine';
import { calculateHorseAss } from './horseAssEngine';

function placeKey(start: number, end: number): string {
  return `${start}-${end}`;
}

function preserveSettlement(next: AwardEntry, existing: AwardEntry[]): AwardEntry {
  const previous = existing.find((entry) => entry.id === next.id);
  return previous
    ? {
        ...next,
        settlementStatus: previous.settlementStatus,
        settledAt: previous.settledAt,
        treasuryTransactionId: previous.treasuryTransactionId
      }
    : next;
}

export function buildAwardEntries(
  roundId: string,
  roundPlayers: RoundPlayer[],
  scorecardEntries: ScorecardEntry[],
  settings: ResultsSettings,
  existing: AwardEntry[] = []
): AwardEntry[] {
  const entries: AwardEntry[] = [];
  const places = calculatePlaces(roundPlayers, scorecardEntries);

  for (const group of places.tieGroups.filter((group) => group.prizePool > 0)) {
    const key = placeKey(group.placeStart, group.placeEnd);
    const official = Math.max(
      0,
      Math.floor(settings.placeTieGroupOverrides[key]?.amount ?? group.payoutEach)
    );
    for (const playerId of group.playerIds) {
      entries.push({
        id: `award:${roundId}:place:${key}:${playerId}`,
        roundId,
        playerId,
        category: 'place',
        label:
          group.playerIds.length > 1
            ? `Places T${group.placeStart}`
            : `Place ${group.placeStart}`,
        calculatedAmount: group.payoutEach,
        officialAmount: official,
        adjustmentReason: settings.placeTieGroupOverrides[key]?.reason,
        settlementStatus: 'unsettled'
      });
    }
  }

  const skins = calculateSkins(
    roundPlayers,
    scorecardEntries,
    settings.skinsPerWinnerOverride?.amount
  );
  for (const skin of skins.winningSkins) {
    if (!skin.winnerId) continue;
    entries.push({
      id: `award:${roundId}:skin:${skin.holeNumber}:${skin.winnerId}`,
      roundId,
      playerId: skin.winnerId,
      category: 'skin',
      label: `Skin — Hole ${skin.holeNumber}`,
      calculatedAmount: skins.calculatedPayoutPerSkin,
      officialAmount: skins.officialPayoutPerSkin,
      adjustmentReason: settings.skinsPerWinnerOverride?.reason,
      settlementStatus: 'unsettled'
    });
  }

  const greenies = calculateGreenies(roundPlayers, settings.greenieSelections ?? {});
  for (const hole of greenies.holes) {
    if (hole.status !== 'winner' || hole.winnerIds.length === 0) continue;
    const override = settings.greenieAwardOverrides?.[String(hole.holeNumber)];
    const officialEach = Math.max(0, override?.amount ?? hole.calculatedAward);
    for (const winnerId of hole.winnerIds) {
      entries.push({
        id: `award:${roundId}:greenie:${hole.holeNumber}:${winnerId}`,
        roundId,
        playerId: winnerId,
        category: 'greenie',
        label: hole.winnerIds.length > 1
          ? `Greenie — Hole ${hole.holeNumber} (tie)`
          : `Greenie — Hole ${hole.holeNumber}`,
        calculatedAmount: hole.calculatedAward,
        officialAmount: officialEach,
        adjustmentReason: override?.reason,
        settlementStatus: 'unsettled'
      });
    }
  }

  const horseAss = calculateHorseAss(
    roundPlayers,
    scorecardEntries,
    settings.horseAssPerWinnerOverride?.amount
  );
  for (const winner of horseAss.winners) {
    entries.push({
      id: `award:${roundId}:horse-ass:${winner.playerId}`,
      roundId,
      playerId: winner.playerId,
      category: 'horse-ass',
      label: "Horse's Ass",
      calculatedAmount: winner.calculatedPayout,
      officialAmount: winner.officialPayout,
      adjustmentReason: settings.horseAssPerWinnerOverride?.reason,
      settlementStatus: 'unsettled'
    });
  }

  return entries.map((entry) => preserveSettlement(entry, existing));
}
