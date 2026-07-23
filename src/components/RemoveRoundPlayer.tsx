import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { Player } from '../types';
import { sortPlayersByLastName } from '../utils/playerSort';

type Props = {
  players: Player[];
  expectedPlayerIds: string[];
  onRemovePlayer: (playerId: string) => void;
  onMarkDns: (playerId: string, reason: string) => void;
  onClose: () => void;
};

export default function RemoveRoundPlayer({
  players,
  expectedPlayerIds,
  onRemovePlayer,
  onMarkDns,
  onClose
}: Props) {
  const [searchText, setSearchText] = useState('');
  const sectionRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    }, 350);
  }, []);

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
      `Remove ${player.name} from today’s round entirely? Use DNS instead when the player arrived but did not begin play.`
    );

    if (!confirmed) return;

    onRemovePlayer(player.id);
    onClose();
  }

  function markDns(player: Player) {
    const reason =
      window.prompt(
        `Why did ${player.name} not start?`,
        ''
      ) ?? '';

    const confirmed = window.confirm(
      `Mark ${player.name} as DNS (Did Not Start)? The player will remain in round history but will be removed from scoring and contests.`
    );

    if (!confirmed) return;

    onMarkDns(player.id, reason.trim());
    onClose();
  }

  return (
    <section className="card" ref={sectionRef}>
      <h2>Player Status or Removal</h2>

      <p>
        Use <strong>DNS</strong> when a player arrived or was expected but
        did not begin play. Use <strong>Remove</strong> only when the player
        should not remain part of today&apos;s round history.
      </p>

      <label>
        <strong>Find Player</strong>

        <input
          ref={searchInputRef}
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
                Current profile: HDCP {player.handicap} · Quota {player.quota}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}
            >
              <button
                type="button"
                onClick={() => markDns(player)}
              >
                Mark DNS
              </button>

              <button
                type="button"
                onClick={() => removePlayer(player)}
              >
                Remove from Round
              </button>
            </div>
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
