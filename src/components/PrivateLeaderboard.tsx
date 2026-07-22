import type { Player } from '../types';
import type {
  LeaderboardPlayer
} from '../engine/leaderboardEngine';

type Props = {
  leaderboard: LeaderboardPlayer[];
  players: Player[];
};

function playerName(
  playerId: string,
  players: Player[]
): string {
  return (
    players.find(
      (player) => player.id === playerId
    )?.name ?? playerId
  );
}

function formatQuotaResult(
  value: number | null
): string {
  if (value === null) {
    return '—';
  }

  if (value > 0) {
    return `+${value}`;
  }

  if (value === 0) {
    return 'E';
  }

  return String(value);
}

function statusLabel(
  status: LeaderboardPlayer['status']
): string {
  switch (status) {
    case 'verified':
      return 'Verified';

    case 'complete':
      return 'Ready to Verify';

    case 'incomplete':
      return 'Incomplete';
  }
}

export default function PrivateLeaderboard({
  leaderboard,
  players
}: Props) {
  return (
    <section className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h2>Private Administrator Standings</h2>

          <p>
            These standings are available only to the
            administrator while the public leaderboard
            remains hidden.
          </p>
        </div>

        <div className="status-box">
          Administrator view only
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="status-box">
          No completed player scores are available yet.
        </div>
      )}

      {leaderboard.length > 0 && (
        <div
          style={{
            overflowX: 'auto',
            marginTop: '1rem'
          }}
        >
          <table
            style={{
              width: '100%',
              minWidth: '760px',
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr>
                <th style={leftHeaderStyle}>
                  Place
                </th>

                <th style={leftHeaderStyle}>
                  Player
                </th>

                <th style={numberHeaderStyle}>
                  Gross
                </th>

                <th style={numberHeaderStyle}>
                  Points
                </th>

                <th style={numberHeaderStyle}>
                  Quota
                </th>

                <th style={numberHeaderStyle}>
                  +/-
                </th>

                <th style={leftHeaderStyle}>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {leaderboard.map(
                (leaderboardPlayer, index) => (
                  <tr
                    key={leaderboardPlayer.playerId}
                  >
                    <td style={placeCellStyle}>
                      {leaderboardPlayer.quotaResult !==
                      null
                        ? index + 1
                        : '—'}
                    </td>

                    <th style={playerCellStyle}>
                      {playerName(
                        leaderboardPlayer.playerId,
                        players
                      )}
                    </th>

                    <td style={numberCellStyle}>
                      {leaderboardPlayer.grossTotal ??
                        '—'}
                    </td>

                    <td style={numberCellStyle}>
                      {leaderboardPlayer
                        .stablefordPoints ?? '—'}
                    </td>

                    <td style={numberCellStyle}>
                      {leaderboardPlayer.quota}
                    </td>

                    <td
                      style={{
                        ...numberCellStyle,
                        fontWeight: 700
                      }}
                    >
                      {formatQuotaResult(
                        leaderboardPlayer.quotaResult
                      )}
                    </td>

                    <td style={statusCellStyle}>
                      {statusLabel(
                        leaderboardPlayer.status
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

const leftHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const numberHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom:
    '2px solid rgba(0, 0, 0, 0.18)'
};

const placeCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.12)',
  fontWeight: 700
};

const playerCellStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.12)'
};

const numberCellStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.12)'
};

const statusCellStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.12)'
};