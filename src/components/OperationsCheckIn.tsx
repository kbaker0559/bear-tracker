import { useMemo, useState } from 'react';
import type { Player } from '../types';
import { sortPlayersByLastName } from '../utils/playerSort';

type Props = {
  players: Player[];
  expectedPlayerIds: string[];
  checkedInPlayerIds: string[];
  paidPlayerIds: string[];
  onToggleCheckedIn: (playerId: string) => void;
  onTogglePaid: (playerId: string) => void;
};

export default function OperationsCheckIn({
  players,
  expectedPlayerIds,
  checkedInPlayerIds,
  paidPlayerIds,
  onToggleCheckedIn,
  onTogglePaid
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

  return (
    <section className="card">
      <h2>Check-In and Payments</h2>

      <p>
        <strong>{checkedInPlayerIds.length}</strong> of{' '}
        <strong>{expectedPlayerIds.length}</strong> checked in ·{' '}
        <strong>{paidPlayerIds.length}</strong> paid
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
        {expectedPlayers.map((player) => {
          const checkedIn = checkedInPlayerIds.includes(player.id);
          const paid = paidPlayerIds.includes(player.id);

          return (
            <div className="score-row" key={player.id}>
              <div>
                <strong>{player.name}</strong>

                <div>
                  HDCP {player.handicap} · Quota {player.quota}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onToggleCheckedIn(player.id)}
              >
                {checkedIn ? '✓ Checked In' : 'Check In'}
              </button>

              <button
                type="button"
                disabled={!checkedIn}
                onClick={() => onTogglePaid(player.id)}
              >
                {paid ? '✓ Paid' : 'Mark Paid'}
              </button>
            </div>
          );
        })}
      </div>

      {expectedPlayers.length === 0 && (
        <p>No expected players match that search.</p>
      )}
    </section>
  );
}