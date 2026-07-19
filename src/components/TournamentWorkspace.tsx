import type { Group, Player } from '../types';
import type { TournamentVisibilitySettings } from '../types/tournamentVisibility';

type Props = {
  groups: Group[];
  players: Player[];
  visibility: TournamentVisibilitySettings;
};

export default function TournamentWorkspace({
  groups,
  players,
  visibility
}: Props) {
  const completedScorecards = 0;
  const waitingScorecards = groups.length - completedScorecards;

  return (
    <section className="card">
      <h2>Tournament Workspace</h2>

      <div className="score-grid">
        <div className="score-row">
          <strong>Round Status</strong>
          <span>Round in Progress</span>
        </div>

        <div className="score-row">
          <strong>Scorecards</strong>
          <span>{groups.length}</span>
        </div>

        <div className="score-row">
          <strong>Completed</strong>
          <span>{completedScorecards}</span>
        </div>

        <div className="score-row">
          <strong>Waiting</strong>
          <span>{waitingScorecards}</span>
        </div>

        <div className="score-row">
          <strong>Leaderboard</strong>
          <span>
            {visibility.liveLeaderboardEnabled
              ? 'Visible During Play'
              : 'Hidden During Play'}
          </span>
        </div>
      </div>

      {!visibility.liveLeaderboardEnabled && (
        <div className="status-box">
          Competitive standings are hidden during play under league rules.
          Tournament calculations may still be reviewed privately by an
          administrator.
        </div>
      )}

      <h3>Scorecard Queue</h3>

      <div className="score-grid">
        {groups.map((group) => (
          <div className="score-row" key={group.id}>
            <div>
              <strong>{group.name.replace('Group', 'Card')}</strong>

              <ul>
                {group.playerIds.map((playerId) => {
                  const player = players.find(
                    (candidate) => candidate.id === playerId
                  );

                  return (
                    <li key={playerId}>
                      {player?.name ?? playerId}
                    </li>
                  );
                })}
              </ul>
            </div>

            <button type="button">
              Enter Scorecard
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}