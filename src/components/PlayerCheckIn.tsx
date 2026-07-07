import type { Player } from '../types';

type Props = {
  players: Player[];
  checkedInPlayerIds: string[];
  onTogglePlayer: (playerId: string) => void;
};

export default function PlayerCheckIn({ players, checkedInPlayerIds, onTogglePlayer }: Props) {
  return (
    <section className="card">
      <h2>Saturday Morning Check-In</h2>
      <p><strong>Players Today:</strong> {checkedInPlayerIds.length}</p>

      <div className="score-grid">
        {[...players]
  .sort((a, b) => {
    const aParts = a.name.split(' ');
    const bParts = b.name.split(' ');
    const aLast = aParts[aParts.length - 1];
    const bLast = bParts[bParts.length - 1];

    return aLast.localeCompare(bLast) || a.name.localeCompare(b.name);
  })
  .map((player) => {
          const checked = checkedInPlayerIds.includes(player.id);

          return (
            <label key={player.id} className="score-row">
              <span>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onTogglePlayer(player.id)}
                />{' '}
                <strong>{player.name}</strong>
              </span>
              <span>HDCP {player.handicap} · Quota {player.quota}</span>
            </label>
          );
        })}
      </div>
    </section>
  );
}