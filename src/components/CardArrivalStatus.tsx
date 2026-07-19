import type { Group, Player } from '../types';

type Props = {
  groups: Group[];
  players: Player[];
  checkedInPlayerIds: string[];
};

export default function CardArrivalStatus({
  groups,
  players,
  checkedInPlayerIds
}: Props) {
  return (
    <section className="card">
      <h2>Card Arrival Status</h2>

      <div className="score-grid">
        {groups.map((group) => {
          const arrivedCount = group.playerIds.filter((playerId) =>
            checkedInPlayerIds.includes(playerId)
          ).length;

          const totalCount = group.playerIds.length;
          const complete = totalCount > 0 && arrivedCount === totalCount;

          return (
            <div className="score-row" key={group.id}>
              <div>
                <strong>
                  {group.name.replace('Group', 'Card')}
                </strong>

                <div>
                  {complete ? 'Ready' : 'Waiting for players'}
                </div>
              </div>

              <strong>
                {arrivedCount} of {totalCount} arrived
              </strong>

              <ul>
                {group.playerIds.map((playerId) => {
                  const player = players.find(
                    (candidate) => candidate.id === playerId
                  );

                  const arrived =
                    checkedInPlayerIds.includes(playerId);

                  return (
                    <li key={playerId}>
                      {arrived ? '✓' : '○'}{' '}
                      {player?.name ?? playerId}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}