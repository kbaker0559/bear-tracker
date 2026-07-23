import {
  useEffect,
  useMemo,
  useState
} from 'react';
import type { Player } from '../types';
import { sortPlayersByLastName } from '../utils/playerSort';

export type WeeklyPlayerSnapshot = {
  playerId: string;
  handicap: number;
  quota: number;
  status: string;
  reviewed: boolean;
};

type Draft = {
  handicap: string;
  quota: string;
};

type Props = {
  players: Player[];
  weeklyPlayers: WeeklyPlayerSnapshot[];
  onUpdateWeeklyPlayer: (
    playerId: string,
    handicap: number,
    quota: number
  ) => void;
};

export default function WeeklyPlayerReview({
  players,
  weeklyPlayers,
  onUpdateWeeklyPlayer
}: Props) {
  const [searchText, setSearchText] = useState('');
  const [showOnlyUnreviewed, setShowOnlyUnreviewed] =
    useState(false);
  const [drafts, setDrafts] = useState<
    Record<string, Draft>
  >({});

  useEffect(() => {
    setDrafts((current) => {
      const next = { ...current };

      for (const weekly of weeklyPlayers) {
        if (!next[weekly.playerId]) {
          next[weekly.playerId] = {
            handicap: String(weekly.handicap),
            quota: String(weekly.quota)
          };
        }
      }

      return next;
    });
  }, [weeklyPlayers]);

  const activeWeeklyPlayers = useMemo(
    () =>
      weeklyPlayers.filter(
        (weekly) =>
          weekly.status !== 'dns' &&
          weekly.status !== 'no-show' &&
          weekly.status !== 'withdrawn' &&
          weekly.status !== 'removed'
      ),
    [weeklyPlayers]
  );

  const reviewedCount = activeWeeklyPlayers.filter(
    (weekly) => weekly.reviewed
  ).length;

  const displayedPlayers = useMemo(() => {
    const normalizedSearch = searchText
      .trim()
      .toLowerCase();

    return sortPlayersByLastName(
      players.filter((player) => {
        const weekly = weeklyPlayers.find(
          (entry) => entry.playerId === player.id
        );

        if (!weekly) return false;

        const active =
          weekly.status !== 'dns' &&
          weekly.status !== 'no-show' &&
          weekly.status !== 'withdrawn' &&
          weekly.status !== 'removed';

        if (!active) return false;

        if (showOnlyUnreviewed && weekly.reviewed) {
          return false;
        }

        return player.name
          .toLowerCase()
          .includes(normalizedSearch);
      })
    );
  }, [
    players,
    weeklyPlayers,
    searchText,
    showOnlyUnreviewed
  ]);

  function updateDraft(
    playerId: string,
    field: keyof Draft,
    value: string
  ) {
    setDrafts((current) => ({
      ...current,
      [playerId]: {
        handicap:
          current[playerId]?.handicap ?? '',
        quota: current[playerId]?.quota ?? '',
        [field]: value
      }
    }));
  }

  function savePlayer(playerId: string) {
    const draft = drafts[playerId];

    if (!draft) return;

    const handicap = Number(draft.handicap);
    const quota = Number(draft.quota);

    if (
      !Number.isInteger(handicap) ||
      handicap < 0 ||
      handicap > 54
    ) {
      window.alert(
        'Handicap must be a whole number between 0 and 54.'
      );
      return;
    }

    if (
      !Number.isInteger(quota) ||
      quota < 0 ||
      quota > 40
    ) {
      window.alert(
        'Points Needed must be a whole number between 0 and 40.'
      );
      return;
    }

    onUpdateWeeklyPlayer(
      playerId,
      handicap,
      quota
    );
  }

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
          <p className="eyebrow">
            Friday Preparation
          </p>

          <h2>Weekly Handicap &amp; Quota Review</h2>

          <p>
            Work down the list while checking GHIN. These
            values apply only to this round.
          </p>
        </div>

        <div className="status-box">
          <strong>
            {reviewedCount} of{' '}
            {activeWeeklyPlayers.length} reviewed
          </strong>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          marginBottom: '1rem'
        }}
      >
        <label style={{ flex: '1 1 18rem' }}>
          <strong>Find Player</strong>
          <input
            type="search"
            value={searchText}
            onChange={(event) =>
              setSearchText(event.target.value)
            }
            placeholder="Type a player’s name..."
            style={{
              display: 'block',
              width: '100%',
              marginTop: '0.5rem',
              padding: '0.75rem',
              fontSize: '1rem'
            }}
          />
        </label>

        <label
          style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
            paddingBottom: '0.75rem'
          }}
        >
          <input
            type="checkbox"
            checked={showOnlyUnreviewed}
            onChange={(event) =>
              setShowOnlyUnreviewed(
                event.target.checked
              )
            }
          />
          Show only players not reviewed
        </label>
      </div>

      {activeWeeklyPlayers.length === 0 && (
        <div className="status-box">
          Import the weekly pairings first. The handicap
          and Points Needed review will appear here.
        </div>
      )}

      {activeWeeklyPlayers.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              minWidth: '680px',
              borderCollapse: 'collapse'
            }}
          >
            <thead>
              <tr>
                <th style={leftHeaderStyle}>Player</th>
                <th style={numberHeaderStyle}>
                  Course Handicap
                </th>
                <th style={numberHeaderStyle}>
                  Points Needed
                </th>
                <th style={leftHeaderStyle}>Status</th>
                <th style={actionHeaderStyle}>Action</th>
              </tr>
            </thead>

            <tbody>
              {displayedPlayers.map((player) => {
                const weekly = weeklyPlayers.find(
                  (entry) =>
                    entry.playerId === player.id
                );

                if (!weekly) return null;

                const draft = drafts[player.id] ?? {
                  handicap: String(weekly.handicap),
                  quota: String(weekly.quota)
                };

                const unchanged =
                  Number(draft.handicap) ===
                    weekly.handicap &&
                  Number(draft.quota) === weekly.quota;

                return (
                  <tr key={player.id}>
                    <th style={playerCellStyle}>
                      {player.name}
                    </th>

                    <td style={numberCellStyle}>
                      <input
                        type="number"
                        min={0}
                        max={54}
                        value={draft.handicap}
                        onChange={(event) =>
                          updateDraft(
                            player.id,
                            'handicap',
                            event.target.value
                          )
                        }
                        onFocus={(event) =>
                          event.currentTarget.select()
                        }
                        style={inputStyle}
                      />
                    </td>

                    <td style={numberCellStyle}>
                      <input
                        type="number"
                        min={0}
                        max={40}
                        value={draft.quota}
                        onChange={(event) =>
                          updateDraft(
                            player.id,
                            'quota',
                            event.target.value
                          )
                        }
                        onFocus={(event) =>
                          event.currentTarget.select()
                        }
                        style={inputStyle}
                      />
                    </td>

                    <td style={statusCellStyle}>
                      {weekly.reviewed
                        ? '✓ Reviewed'
                        : 'Not reviewed'}
                    </td>

                    <td style={actionCellStyle}>
                      <button
                        type="button"
                        onClick={() =>
                          savePlayer(player.id)
                        }
                      >
                        {weekly.reviewed && unchanged
                          ? 'Reviewed'
                          : 'Save & Mark Reviewed'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeWeeklyPlayers.length > 0 &&
        displayedPlayers.length === 0 && (
          <p>No players match the current filter.</p>
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

const actionHeaderStyle = {
  ...numberHeaderStyle
};

const playerCellStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.12)'
};

const numberCellStyle = {
  padding: '0.5rem',
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

const actionCellStyle = {
  padding: '0.5rem',
  textAlign: 'center' as const,
  borderBottom:
    '1px solid rgba(0, 0, 0, 0.12)'
};

const inputStyle = {
  width: '6rem',
  padding: '0.55rem',
  textAlign: 'center' as const,
  fontSize: '1rem'
};
