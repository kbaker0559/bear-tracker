import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/Card';
import { blackBearHoles } from '../data/course';
import { calculateNetSkins, calculateResults, netScore, stablefordPoints, strokesReceivedOnHole } from '../engine/scoring';
import { clearScores, loadGroups, loadPlayers, loadScores, resetPlayers, saveGroups, savePlayers, saveScores } from '../storage';
import type { Group, Player, Score } from '../types/models';
import { GroupAdmin } from './GroupAdmin';
import { Login } from './Login';
import { PlayerAdmin } from './PlayerAdmin';

type Tab = 'scores' | 'leaderboard' | 'skins' | 'groups' | 'players';

function playerName(players: Player[], id: string): string {
  return players.find((p) => p.id === id)?.name ?? 'Unknown player';
}

export function Dashboard() {
  const [players, setPlayers] = useState<Player[]>(() => loadPlayers());
  const [groups, setGroups] = useState<Group[]>(() => loadGroups());
  const [scores, setScores] = useState<Score[]>(() => loadScores());
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [selectedHole, setSelectedHole] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [tab, setTab] = useState<Tab>('scores');

  useEffect(() => savePlayers(players), [players]);
  useEffect(() => saveGroups(groups), [groups]);
  useEffect(() => saveScores(scores), [scores]);

  const activePlayers = players.filter((p) => p.active);
  const results = useMemo(() => calculateResults(activePlayers, blackBearHoles, scores), [activePlayers, scores]);
  const skins = useMemo(() => calculateNetSkins(activePlayers, blackBearHoles, scores), [activePlayers, scores]);

  const availableGroups = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.isAdmin) return groups;
    return groups.filter((group) => group.scorekeeperIds.includes(currentUser.id));
  }, [currentUser, groups]);

  useEffect(() => {
    if (availableGroups.length === 0) {
      setSelectedGroupId('');
      return;
    }
    if (!availableGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(availableGroups[0].id);
    }
  }, [availableGroups, selectedGroupId]);

  if (!currentUser) {
    return <Login players={players} onLogin={setCurrentUser} />;
  }

  const selectedGroup = groups.find((group) => group.id === selectedGroupId) ?? availableGroups[0];
  const selectedHoleData = blackBearHoles.find((hole) => hole.number === selectedHole) ?? blackBearHoles[0];

  function updatePlayers(nextPlayers: Player[]) {
    setPlayers(nextPlayers);
    const activeIds = new Set(nextPlayers.filter((p) => p.active).map((p) => p.id));
    setGroups((currentGroups) => currentGroups.map((group) => ({
      ...group,
      playerIds: group.playerIds.filter((id) => activeIds.has(id)),
      scorekeeperIds: group.scorekeeperIds.filter((id) => activeIds.has(id))
    })));
    const refreshedUser = currentUser ? nextPlayers.find((p) => p.id === currentUser.id) : null;
    if (refreshedUser) setCurrentUser(refreshedUser);
  }

  function saveScore(playerId: string, gross: number) {
    if (!Number.isFinite(gross) || gross <= 0) return;
    setScores((current) => [
      ...current.filter((s) => !(s.playerId === playerId && s.hole === selectedHole)),
      { playerId, hole: selectedHole, gross }
    ]);
  }

  function resetAllPlayers() {
    if (!confirm('Reset all players to the original Saturday list? This also clears saved groups.')) return;
    const restored = resetPlayers();
    setPlayers(restored);
    const freshGroups = loadGroups();
    setGroups(freshGroups);
    const kevin = restored.find((p) => p.isAdmin) ?? restored[0];
    setCurrentUser(kevin);
  }

  function resetScores() {
    if (!confirm('Clear all entered scores for this round?')) return;
    clearScores();
    setScores([]);
  }

  const canScore = Boolean(selectedGroup) && (currentUser.isAdmin || selectedGroup.scorekeeperIds.includes(currentUser.id));

  return (
    <main className="layout">
      <header className="hero">
        <div>
          <p className="eyebrow">Black Bear Saturday Game</p>
          <h1>Bear Tracker</h1>
          <p>Signed in as <strong>{currentUser.name}</strong>{currentUser.isAdmin ? ' · Admin' : ''}</p>
        </div>
        <div className="hero-actions">
          <button onClick={resetScores}>Reset scores</button>
          <button className="secondary" onClick={() => setCurrentUser(null)}>Sign out</button>
        </div>
      </header>

      <nav className="tabs">
        <button className={tab === 'scores' ? 'active' : ''} onClick={() => setTab('scores')}>Group Scores</button>
        <button className={tab === 'leaderboard' ? 'active' : ''} onClick={() => setTab('leaderboard')}>Leaderboard</button>
        <button className={tab === 'skins' ? 'active' : ''} onClick={() => setTab('skins')}>Skins</button>
        {currentUser.isAdmin && <button className={tab === 'groups' ? 'active' : ''} onClick={() => setTab('groups')}>Admin · Groups</button>}
        {currentUser.isAdmin && <button className={tab === 'players' ? 'active' : ''} onClick={() => setTab('players')}>Admin · Players</button>}
      </nav>

      {tab === 'scores' && (
        <div className="grid two">
          <Card title="Group Score Entry">
            {availableGroups.length === 0 ? (
              <p className="error">You are not assigned as a scorekeeper for any group yet.</p>
            ) : (
              <div className="form-stack">
                <label>
                  Group
                  <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
                    {availableGroups.map((group) => (
                      <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Hole
                  <select value={selectedHole} onChange={(e) => setSelectedHole(Number(e.target.value))}>
                    {blackBearHoles.map((hole) => (
                      <option key={hole.number} value={hole.number}>Hole {hole.number} · Par {hole.par} · HDCP {hole.strokeIndex}</option>
                    ))}
                  </select>
                </label>
                <div className="hole-banner">
                  <strong>Hole {selectedHoleData.number}</strong>
                  <span>Par {selectedHoleData.par}</span>
                  <span>Stroke Index {selectedHoleData.strokeIndex}</span>
                </div>
                {canScore && selectedGroup && (
                  <div className="score-list">
                    {selectedGroup.playerIds.map((playerId) => {
                      const player = players.find((p) => p.id === playerId);
                      if (!player) return null;
                      const existing = scores.find((s) => s.playerId === player.id && s.hole === selectedHole)?.gross ?? '';
                      const gross = Number(existing);
                      const strokes = strokesReceivedOnHole(player.handicap, selectedHoleData.strokeIndex);
                      const net = Number.isFinite(gross) && gross > 0 ? netScore(gross, player.handicap, selectedHoleData) : null;
                      const points = net === null ? null : stablefordPoints(net, selectedHoleData.par);
                      return (
                        <div className="group-score-row" key={player.id}>
                          <div>
                            <strong>{player.name}</strong>
                            <p className="muted">Gets {strokes} stroke{strokes === 1 ? '' : 's'} · Quota {player.quota}</p>
                          </div>
                          <input type="number" min="1" value={existing} onChange={(e) => saveScore(player.id, Number(e.target.value))} />
                          <div className="score-math">
                            {net === null ? <span className="muted">Pending</span> : <span>Net {net} · {points} pt{points === 1 ? '' : 's'}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <p className="muted">Sprint 3 supports official group scorekeepers. Admins can score any group.</p>
          </Card>
          <GroupSummaryCard groups={groups} players={players} />
        </div>
      )}

      {tab === 'leaderboard' && <LeaderboardCard results={results} />}

      {tab === 'skins' && (
        <Card title="Net Skins Preview">
          <div className="skins-grid">
            {skins.map((skin) => {
              const winner = players.find((p) => p.id === skin.winnerPlayerId);
              return (
                <div className="skin" key={skin.hole}>
                  <strong>Hole {skin.hole}</strong>
                  <span>{winner ? `${winner.name} · Net ${skin.winningNetScore}` : skin.tied ? 'No skin — tied' : 'Pending'}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'groups' && currentUser.isAdmin && (
        <GroupAdmin players={players} groups={groups} onChange={setGroups} />
      )}

      {tab === 'players' && currentUser.isAdmin && (
        <div className="grid">
          <PlayerAdmin players={players} onChange={updatePlayers} />
          <Card title="Admin Utilities">
            <button className="danger" onClick={resetAllPlayers}>Reset original player list</button>
          </Card>
        </div>
      )}
    </main>
  );
}

function GroupSummaryCard({ groups, players }: { groups: Group[]; players: Player[] }) {
  return (
    <Card title="Today’s Groups">
      <div className="summary-groups">
        {groups.map((group) => (
          <div key={group.id} className="summary-group">
            <strong>{group.name}</strong>
            <p className="muted">Scorekeeper{group.scorekeeperIds.length === 1 ? '' : 's'}: {group.scorekeeperIds.map((id) => playerName(players, id)).join(', ') || 'None selected'}</p>
            <ol>
              {group.playerIds.map((id) => <li key={id}>{playerName(players, id)}</li>)}
            </ol>
          </div>
        ))}
      </div>
    </Card>
  );
}

function LeaderboardCard({ results }: { results: ReturnType<typeof calculateResults> }) {
  return (
    <Card title="Quota Leaderboard">
      <table>
        <thead><tr><th>Pos</th><th>Player</th><th>Thru</th><th>Pts</th><th>Quota</th><th>+/-</th></tr></thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={result.player.id}>
              <td>{index + 1}</td>
              <td>{result.player.name}</td>
              <td>{result.thru}</td>
              <td>{result.stablefordPoints}</td>
              <td>{result.player.quota}</td>
              <td className={result.quotaPlusMinus >= 0 ? 'positive' : 'negative'}>{result.quotaPlusMinus}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
