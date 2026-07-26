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
  playingThisWeek?: boolean;
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

        return player.active && player.name
          .toLowerCase()
          .includes(normalizedSearch);
      })
    );
  }, [players, weeklyPlayers, searchText]);

  const unreviewedPlayers = displayedPlayers.filter((player) =>
    !weeklyPlayers.find((entry) => entry.playerId === player.id)?.reviewed
  );
  const reviewedPlayers = displayedPlayers.filter((player) =>
    weeklyPlayers.find((entry) => entry.playerId === player.id)?.reviewed
  );

  function updateDraft(
    playerId: string,
    field: keyof Draft,
    value: string
  ) {
    setDrafts((current) => ({
      ...current,
      [playerId]: {
        handicap: current[playerId]?.handicap ?? '',
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

    if (!Number.isInteger(handicap) || handicap < 0 || handicap > 54) {
      window.alert('Handicap must be a whole number between 0 and 54.');
      return;
    }

    if (!Number.isInteger(quota) || quota < 0 || quota > 40) {
      window.alert('Points Needed must be a whole number between 0 and 40.');
      return;
    }

    onUpdateWeeklyPlayer(playerId, handicap, quota);
  }

  function renderPlayerTable(list: Player[], reviewed: boolean) {
    if (list.length === 0) {
      return (
        <div className="status-box">
          {reviewed
            ? 'No reviewed players match the current search.'
            : 'All matching players have been reviewed.'}
        </div>
      );
    }

    return (
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            minWidth: '620px',
            borderCollapse: 'collapse'
          }}
        >
          <thead>
            <tr>
              <th style={leftHeaderStyle}>Player</th>
              <th style={numberHeaderStyle}>Course Handicap</th>
              <th style={numberHeaderStyle}>Points Needed</th>
              <th style={actionHeaderStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((player) => {
              const weekly = weeklyPlayers.find(
                (entry) => entry.playerId === player.id
              );
              if (!weekly) return null;

              const draft = drafts[player.id] ?? {
                handicap: String(weekly.handicap),
                quota: String(weekly.quota)
              };
              const unchanged =
                Number(draft.handicap) === weekly.handicap &&
                Number(draft.quota) === weekly.quota;

              return (
                <tr key={player.id}>
                  <th style={playerCellStyle}>
                    {reviewed ? '✓ ' : ''}{player.name}{weekly.playingThisWeek ? ' • This week' : ''}
                  </th>
                  <td style={numberCellStyle}>
                    <input
                      type="number"
                      min={0}
                      max={54}
                      value={draft.handicap}
                      onChange={(event) =>
                        updateDraft(player.id, 'handicap', event.target.value)
                      }
                      onFocus={(event) => event.currentTarget.select()}
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
                        updateDraft(player.id, 'quota', event.target.value)
                      }
                      onFocus={(event) => event.currentTarget.select()}
                      style={inputStyle}
                    />
                  </td>
                  <td style={actionCellStyle}>
                    <button type="button" onClick={() => savePlayer(player.id)}>
                      {reviewed && unchanged ? 'Reviewed' : 'Save & Mark Reviewed'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="card">
      <div className="weekly-review-header">
        <div>
          <p className="eyebrow">Friday Preparation</p>
          <h2>Weekly Handicap &amp; Quota Review</h2>
          <p>
            Work down the left column while checking GHIN. Saved players
            move to the reviewed column on the right.
          </p>
        </div>
        <div className="status-box">
          <strong>{reviewedCount} of {activeWeeklyPlayers.length} reviewed</strong>
        </div>
      </div>

      <div className="weekly-review-filters">
        <label style={{ flex: '1 1 18rem' }}>
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
              padding: '0.75rem',
              fontSize: '1rem'
            }}
          />
        </label>
        <label className="weekly-review-checkbox">
          <input
            type="checkbox"
            checked={showOnlyUnreviewed}
            onChange={(event) => setShowOnlyUnreviewed(event.target.checked)}
          />
          Hide reviewed column
        </label>
      </div>

      {activeWeeklyPlayers.length === 0 ? (
        <div className="status-box">
          Import the weekly pairings first. The handicap and Points Needed
          review will appear here.
        </div>
      ) : (
        <div className={`weekly-review-columns ${showOnlyUnreviewed ? 'single' : ''}`}>
          <section>
            <h3>Needs Review ({unreviewedPlayers.length})</h3>
            {renderPlayerTable(unreviewedPlayers, false)}
          </section>
          {!showOnlyUnreviewed && (
            <section>
              <h3>Reviewed ({reviewedPlayers.length})</h3>
              {renderPlayerTable(reviewedPlayers, true)}
            </section>
          )}
        </div>
      )}
    </section>
  );
}

const leftHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom: '2px solid rgba(0, 0, 0, 0.18)'
};
const numberHeaderStyle = {
  padding: '0.75rem',
  textAlign: 'center' as const,
  borderBottom: '2px solid rgba(0, 0, 0, 0.18)'
};
const actionHeaderStyle = { ...numberHeaderStyle };
const playerCellStyle = {
  padding: '0.75rem',
  textAlign: 'left' as const,
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
};
const numberCellStyle = {
  padding: '0.5rem',
  textAlign: 'center' as const,
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
};
const actionCellStyle = {
  padding: '0.5rem',
  textAlign: 'center' as const,
  borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
};
const inputStyle = {
  width: '6rem',
  padding: '0.55rem',
  textAlign: 'center' as const,
  fontSize: '1rem'
};
