import { useMemo, useState } from 'react';
import type { Group, Player } from '../types';
import type { TournamentEvent } from '../types/tournamentEvent';

type Props = {
  events: TournamentEvent[];
  players: Player[];
  groups: Group[];
  onAddNote: (note: string) => void;
};

function playerName(
  playerId: string,
  players: Player[]
): string {
  return (
    players.find((player) => player.id === playerId)
      ?.name ?? playerId
  );
}

function cardName(
  scorecardId: string | undefined,
  groups: Group[]
): string | null {
  if (!scorecardId) {
    return null;
  }

  const group = groups.find(
    (candidate) => candidate.id === scorecardId
  );

  return group
    ? group.name.replace('Group', 'Card')
    : scorecardId;
}

function formatTime(value: string): string {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function TournamentEventLog({
  events,
  players,
  groups,
  onAddNote
}: Props) {
  const [note, setNote] = useState('');

  const orderedEvents = useMemo(
    () =>
      [...events].sort((first, second) =>
        second.occurredAt.localeCompare(
          first.occurredAt
        )
      ),
    [events]
  );

  function saveNote() {
    const trimmed = note.trim();

    if (!trimmed) {
      return;
    }

    onAddNote(trimmed);
    setNote('');
  }

  return (
    <section className="card">
      <h2>Tournament Event Log</h2>

      <p>
        Bear Tracker records late adds, DNS players,
        withdrawals, restores, card changes, and other
        important round notes.
      </p>

      <label>
        <strong>Add Round Note</strong>

        <textarea
          value={note}
          onChange={(event) =>
            setNote(event.target.value)
          }
          placeholder="Rain delay, pro shop message, pairing explanation..."
          rows={3}
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.5rem',
            marginBottom: '0.75rem',
            padding: '0.75rem',
            fontSize: '1rem'
          }}
        />
      </label>

      <button
        type="button"
        disabled={!note.trim()}
        onClick={saveNote}
      >
        Add Note to Event Log
      </button>

      <h3 style={{ marginTop: '2rem' }}>
        Round History
      </h3>

      {orderedEvents.length === 0 && (
        <p>No tournament events have been recorded yet.</p>
      )}

      <div className="score-grid">
        {orderedEvents.map((event) => {
          const relatedPlayers =
            event.playerIds?.map((playerId) =>
              playerName(playerId, players)
            ) ?? [];

          const fromCard = cardName(
            event.fromScorecardId,
            groups
          );

          const toCard = cardName(
            event.toScorecardId ?? event.scorecardId,
            groups
          );

          return (
            <div className="score-row" key={event.id}>
              <div>
                <strong>{event.summary}</strong>

                {relatedPlayers.length > 0 && (
                  <div>{relatedPlayers.join(', ')}</div>
                )}

                {(fromCard || toCard) && (
                  <div>
                    {fromCard && toCard
                      ? `${fromCard} → ${toCard}`
                      : toCard ?? fromCard}
                  </div>
                )}

                {event.note && (
                  <div style={{ marginTop: '0.25rem' }}>
                    Note: {event.note}
                  </div>
                )}
              </div>

              <span>{formatTime(event.occurredAt)}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
