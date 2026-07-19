import { useMemo, useState } from 'react';
import type { Player } from '../types';
import { sortPlayersByLastName } from '../utils/playerSort';

type Props = {
  players: Player[];
  expectedPlayerIds: string[];
  onRemovePlayer: (playerId: string) => void;
  onClose: () => void;
};

export default function RemoveRoundPlayer({
  players,
  expectedPlayerIds,
  onRemovePlayer,
  onClose
}: Props) {
  const [searchText, setSearchText] = useState('');

  const expectedPlayers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return sortPlayersByLastName(
      players.filter(
        (player) =>
          expectedPlayerIds.includes(player.id) &&
          player.name.toLowerCase().includes(normalizedSearch)
      )
    );
  }, [players, expectedPlayerIds, searchText]);

  function removePlayer(player: Player) {
    const confirmed = window.confirm(
      `Remove ${player.name} from today’s round? This will also remove the player from their scorecard.`
    );

    if (!confirmed) return;

    onRemovePlayer(player.id);
    onClose();
  }

  return (
    <section className="card">
      <h2>Remove Player from Today&apos;s Round</h2>

      <p>
        Use this for a late call-out, illness, flat tire, or other withdrawal
        before play.
      </p>

      <label>
        <strong>Find Player</strong>

        <input
          type="search"
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          placeholder="Type a player’s name..."
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            fontSize: '1rem'
          }}
        />
      </label>

      <div className="score-grid">
        {expectedPlayers.map((player) => (
          <div className="score-row" key={player.id}>
            <div>
              <strong>{player.name}</strong>

              <div>
                HDCP {player.handicap} · Quota {player.quota}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removePlayer(player)}
            >
              Remove from Round
            </button>
          </div>
        ))}
      </div>

      {expectedPlayers.length === 0 && (
        <p>No expected players match that search.</p>
      )}

      <button type="button" onClick={onClose}>
        Cancel
      </button>
    </section>
  );
}