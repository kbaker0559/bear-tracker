import { useMemo, useState } from 'react';
import type { Group, Player } from '../types';
import { matchPlayer } from '../services/playerMatcher';
import { parsePairingsEmail } from '../utils/parsePairings';

type Props = {
  players: Player[];
  onApplyPairings: (groups: Group[]) => void;
};

export default function PairingsImport({
  players,
  onApplyPairings
}: Props) {
  const [text, setText] = useState('');

  const parsed = useMemo(() => parsePairingsEmail(text), [text]);

  const reviewedGroups = useMemo(
    () =>
      parsed.map((group) => ({
        ...group,
        reviewedPlayers: group.players.map((player) => ({
          ...player,
          match: matchPlayer(player.name, players)
        }))
      })),
    [parsed, players]
  );

  const unresolvedPlayers = reviewedGroups.flatMap((group) =>
    group.reviewedPlayers.filter(
      (player) =>
        player.match.status === 'suggested' ||
        player.match.status === 'unmatched'
    )
  );

  const groups: Group[] = reviewedGroups.map((group) => ({
    id: `card-${group.groupNumber}`,
    name: `Card ${group.groupNumber}`,
    playerIds: group.reviewedPlayers
      .map((player) => player.match.playerId)
      .filter((id): id is string => Boolean(id)),
    scorekeeperIds: []
  }));

  function applyPairings() {
    if (unresolvedPlayers.length > 0) return;
    onApplyPairings(groups);
  }

  return (
    <section className="card">
      <h2>Round Setup — Import Pairings</h2>

      <p>
        Paste the pairings table, review every player match, and then create
        the scorecards.
      </p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={14}
        style={{ width: '100%', fontFamily: 'monospace' }}
        placeholder="Paste pairings here..."
      />

      <div className="row footer-actions">
        <button
          onClick={applyPairings}
          disabled={parsed.length === 0 || unresolvedPlayers.length > 0}
        >
          Apply Pairings
        </button>

        <button onClick={() => setText('')}>
          Clear
        </button>
      </div>

      {parsed.length > 0 && (
        <p>
          <strong>{parsed.length}</strong> scorecards ·{' '}
          <strong>
            {reviewedGroups.reduce(
              (sum, group) => sum + group.reviewedPlayers.length,
              0
            )}
          </strong>{' '}
          players ·{' '}
          <strong>{unresolvedPlayers.length}</strong> need attention
        </p>
      )}

      <h3>Review Import</h3>

      {reviewedGroups.map((group) => (
        <div key={group.groupNumber} className="score-row">
          <strong>
            Card {group.groupNumber} ·{' '}
            {group.teeTime || 'No tee time found'}
          </strong>

          <ul>
            {group.reviewedPlayers.map((player) => (
              <li key={`${group.groupNumber}-${player.name}`}>
                {player.match.status === 'exact' && '✓ '}
                {player.match.status === 'alias' && '✓ '}
                {player.match.status === 'suggested' && '⚠ '}
                {player.match.status === 'unmatched' && '✖ '}

                {player.name} · {player.tee} · HDCP {player.handicap}

                {player.match.status === 'alias' && (
                  <> — matched to {player.match.matchedName}</>
                )}

                {player.match.status === 'suggested' && (
                  <> — possible match: {player.match.matchedName}</>
                )}

                {player.match.status === 'unmatched' && (
                  <> — no roster match</>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      {unresolvedPlayers.length > 0 && (
        <div className="status-box">
          Resolve all suggested or unmatched players before applying the
          pairings.
        </div>
      )}
    </section>
  );
}