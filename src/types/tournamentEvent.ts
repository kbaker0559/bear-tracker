export type TournamentEventType =
  | 'late-add'
  | 'dns'
  | 'withdrawn'
  | 'removed'
  | 'restored'
  | 'player-moved'
  | 'players-swapped'
  | 'scorecard-reordered'
  | 'scorekeeper-changed'
  | 'note'
  | 'quota-updated'
  | 'finalized';

export type TournamentEvent = {
  id: string;
  roundId: string;
  type: TournamentEventType;
  occurredAt: string;

  summary: string;
  note?: string;

  playerIds?: string[];
  scorecardId?: string;
  fromScorecardId?: string;
  toScorecardId?: string;
};
