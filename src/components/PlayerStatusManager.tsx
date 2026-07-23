import { useMemo, useState } from 'react';
import type { Group, Player } from '../types';
import type {
  RoundPlayer,
  RoundPlayerStatus
} from '../types/roundPlayer';
import { sortPlayersByLastName } from '../utils/playerSort';

type Props = {
  players: Player[];
  groups: Group[];
  roundPlayers: RoundPlayer[];
  onSetInactiveStatus: (
    playerId: string,
    status: Extract<
      RoundPlayerStatus,
      'dns' | 'withdrawn' | 'removed'
    >,
    reason: string
  ) => void;
  onRestorePlayer: (playerId: string) => void;
  onAddPlayerBack: (
    playerId: string,
    groupId: string,
    handicap: number,
    quota: number
  ) => void;
  onClose: () => void;
};

function displayStatus(status: RoundPlayerStatus): string {
  switch (status) {
    case 'dns':
      return 'DNS';
    case 'withdrawn':
      return 'Withdrawn';
    case 'removed':
      return 'Removed';
    default:
      return 'Active';
  }
}

export default function PlayerStatusManager({
  players,
  groups,
  roundPlayers,
  onSetInactiveStatus,
  onRestorePlayer,
  onAddPlayerBack,
  onClose
}: Props) {
  const [selectedPlayerId, setSelectedPlayerId] =
    useState('');
  const [selectedStatus, setSelectedStatus] =
    useState<'dns' | 'withdrawn' | 'removed'>('dns');
  const [reason, setReason] = useState('');

  const [addBackPlayerId, setAddBackPlayerId] =
    useState('');
  const [addBackGroupId, setAddBackGroupId] =
    useState(groups[0]?.id ?? '');
  const [addBackHandicap, setAddBackHandicap] =
    useState('');
  const [addBackQuota, setAddBackQuota] =
    useState('');

  const activeRoundPlayers = useMemo(
    () =>
      roundPlayers.filter(
        (entry) =>
          entry.status !== 'dns' &&
          entry.status !== 'withdrawn' &&
          entry.status !== 'removed' &&
          entry.status !== 'no-show'
      ),
    [roundPlayers]
  );

  const inactiveRoundPlayers = useMemo(
    () =>
      roundPlayers.filter(
        (entry) =>
          entry.status === 'dns' ||
          entry.status === 'withdrawn' ||
          entry.status === 'removed' ||
          entry.status === 'no-show'
      ),
    [roundPlayers]
  );

  const availablePlayers = useMemo(
    () =>
      sortPlayersByLastName(
        players.filter(
          (player) =>
            !roundPlayers.some(
              (entry) => entry.playerId === player.id
            )
        )
      ),
    [players, roundPlayers]
  );

  function playerName(playerId: string): string {
    return (
      players.find((player) => player.id === playerId)
        ?.name ?? playerId
    );
  }

  function submitStatus() {
    if (!selectedPlayerId) {
      window.alert('Select a player first.');
      return;
    }

    const name = playerName(selectedPlayerId);
    const confirmed = window.confirm(
      selectedStatus === 'removed'
        ? `Remove ${name} from this round? The player can be restored later.`
        : `Mark ${name} as ${displayStatus(selectedStatus)}? The player can be restored later.`
    );

    if (!confirmed) return;

    onSetInactiveStatus(
      selectedPlayerId,
      selectedStatus,
      reason.trim()
    );

    setSelectedPlayerId('');
    setReason('');
  }

  function selectAddBackPlayer(playerId: string) {
    setAddBackPlayerId(playerId);
    const player = players.find(
      (candidate) => candidate.id === playerId
    );
    setAddBackHandicap(
      player ? String(player.handicap) : ''
    );
    setAddBackQuota(
      player ? String(player.quota) : ''
    );
  }

  function addBack() {
    const handicap = Number(addBackHandicap);
    const quota = Number(addBackQuota);

    if (!addBackPlayerId || !addBackGroupId) {
      window.alert('Select a player and a card.');
      return;
    }

    if (!Number.isInteger(handicap) || handicap < 0) {
      window.alert('Enter a valid course handicap.');
      return;
    }

    if (!Number.isInteger(quota) || quota < 0) {
      window.alert('Enter a valid Points Needed value.');
      return;
    }

    onAddPlayerBack(
      addBackPlayerId,
      addBackGroupId,
      handicap,
      quota
    );

    setAddBackPlayerId('');
    setAddBackHandicap('');
    setAddBackQuota('');
  }

  return (
    <section className="card">
      <h2>Player Status</h2>

      <p>
        Mark a golfer DNS, withdrawn, or removed. These
        actions are reversible.
      </p>

      <div className="score-grid">
        <label className="score-row">
          <strong>Active Player</strong>
          <select
            value={selectedPlayerId}
            onChange={(event) =>
              setSelectedPlayerId(event.target.value)
            }
          >
            <option value="">Select player</option>
            {activeRoundPlayers.map((entry) => (
              <option
                key={entry.playerId}
                value={entry.playerId}
              >
                {playerName(entry.playerId)}
              </option>
            ))}
          </select>
        </label>

        <label className="score-row">
          <strong>New Status</strong>
          <select
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value as
                  | 'dns'
                  | 'withdrawn'
                  | 'removed'
              )
            }
          >
            <option value="dns">DNS</option>
            <option value="withdrawn">Withdrawn</option>
            <option value="removed">Removed</option>
          </select>
        </label>

        <label className="score-row">
          <strong>Reason (optional)</strong>
          <input
            value={reason}
            onChange={(event) =>
              setReason(event.target.value)
            }
            placeholder="Vertigo, illness, entered in error..."
          />
        </label>
      </div>

      <button type="button" onClick={submitStatus}>
        Save Player Status
      </button>

      <h3 style={{ marginTop: '2rem' }}>
        Players Not Participating
      </h3>

      {inactiveRoundPlayers.length === 0 && (
        <p>No players are currently inactive.</p>
      )}

      <div className="score-grid">
        {inactiveRoundPlayers.map((entry) => (
          <div className="score-row" key={entry.playerId}>
            <div>
              <strong>{playerName(entry.playerId)}</strong>
              <div>
                {displayStatus(entry.status)}
                {entry.statusReason
                  ? ` — ${entry.statusReason}`
                  : ''}
              </div>
            </div>

            <button
              type="button"
              onClick={() => onRestorePlayer(entry.playerId)}
            >
              Restore to Round
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ marginTop: '2rem' }}>
        Add Back a Player Missing from the Round
      </h3>

      <p>
        Use this when a golfer was removed by an older
        version of Bear Tracker. This is the recovery path
        for Bruce Coleman.
      </p>

      {availablePlayers.length === 0 ? (
        <p>Every player profile is already in this round.</p>
      ) : (
        <div className="score-grid">
          <label className="score-row">
            <strong>Player</strong>
            <select
              value={addBackPlayerId}
              onChange={(event) =>
                selectAddBackPlayer(event.target.value)
              }
            >
              <option value="">Select player</option>
              {availablePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.name}
                </option>
              ))}
            </select>
          </label>

          <label className="score-row">
            <strong>Restore to Card</strong>
            <select
              value={addBackGroupId}
              onChange={(event) =>
                setAddBackGroupId(event.target.value)
              }
            >
              {groups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name.replace('Group', 'Card')}
                </option>
              ))}
            </select>
          </label>

          <label className="score-row">
            <strong>Course Handicap</strong>
            <input
              type="number"
              value={addBackHandicap}
              onChange={(event) =>
                setAddBackHandicap(event.target.value)
              }
            />
          </label>

          <label className="score-row">
            <strong>Points Needed</strong>
            <input
              type="number"
              value={addBackQuota}
              onChange={(event) =>
                setAddBackQuota(event.target.value)
              }
            />
          </label>
        </div>
      )}

      {availablePlayers.length > 0 && (
        <button type="button" onClick={addBack}>
          Add Player Back to Round
        </button>
      )}

      <button
        type="button"
        onClick={onClose}
        style={{ marginLeft: '0.75rem' }}
      >
        Close
      </button>
    </section>
  );
}
