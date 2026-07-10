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
  const expectedPlayers = sortPlayersByLastName(
    players.filter((player) => expectedPlayerIds.includes(player.id))
  );

  return (
    <section className="card">
      <h2>Check-In and Payments</h2>

      <p>
        <strong>{checkedInPlayerIds.length}</strong> of{' '}
        <strong>{expectedPlayerIds.length}</strong> checked in ·{' '}
        <strong>{paidPlayerIds.length}</strong> paid
      </p>

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

              <label>
                <input
                  type="checkbox"
                  checked={checkedIn}
                  onChange={() => onToggleCheckedIn(player.id)}
                />{' '}
                Checked In
              </label>

              <label>
                <input
                  type="checkbox"
                  checked={paid}
                  disabled={!checkedIn}
                  onChange={() => onTogglePaid(player.id)}
                />{' '}
                Paid
              </label>
            </div>
          );
        })}
      </div>
    </section>
  );
}