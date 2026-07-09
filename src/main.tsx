import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AppShell from './components/AppShell';
import HomeWorkspace from './components/HomeWorkspace';
import OperationsWorkspace from './components/OperationsWorkspace';
import { blackBearCourse } from './data/course';
import { initialPlayers } from './data/players';
import PairingsImport from './components/PairingsImport';
import ScorecardBuilder from './components/ScorecardBuilder';
import PlayerCheckIn from './components/PlayerCheckIn';
import { leaderboard } from './engine/scoring';
import { skins } from './engine/skins';
import { getPayoutLookup } from './data/payoutLookup';
export function calculateFinancialCheck(playerCount: number) {
  const lookup = getPayoutLookup(playerCount);
  const greeniesTotal = Object.values(lookup.greenies).reduce((sum, amount) => sum + amount, 0);
  const allocatedTotal =
    lookup.placesTotal +
    lookup.skins +
    lookup.horseAss +
    greeniesTotal;

  return {
    playerCount,
    prizePool: lookup.prizePool,
    allocatedTotal,
    difference: lookup.prizePool - allocatedTotal,
    balanced: lookup.prizePool === allocatedTotal
  };
}
import { loadJson, saveJson } from './storage/localStore';
import { testSupabaseConnection, pushPlayers, type SupabaseConfig } from './services/supabaseRest';
import type { Group, Player, ScoreMap } from './types';
import SaturdayRound from './components/SaturdayRound';
import type { Round } from './types/round';
import './styles.css';
const STORAGE_KEY = 'bear-tracker-sprint7';
const SUPABASE_CONFIG_KEY = 'bear-tracker-supabase-config';

type Tab = 'round' | 'checkin' | 'pairings' | 'scorecards' | 'score' | 'leaderboard' | 'skins' | 'import' | 'admin' | 'live';

type AppState = {
  players: Player[];
  scores: ScoreMap;
  groups: Group[];
  currentHole: number;
};

const defaultGroups: Group[] = [
  {
    id: 'g1',
    name: 'Card 1',
    playerIds: ['kevin-baker', 'fred-tucker', 'cam-crollard', 'neal-self'],
    scorekeeperIds: ['kevin-baker']
  },
  {
    id: 'g2',
    name: 'Card 2',
    playerIds: ['paul-tucker-jr', 'paul-tucker-sr', 'george-heider', 'dave-hall'],
    scorekeeperIds: ['paul-tucker-jr']
  }
];
function createCurrentRound(players: Player[], scores: ScoreMap, groups: Group[]): Round {
  return {
    id: 'current-round',
    date: new Date().toISOString().slice(0, 10),
    players: players.filter((p) => p.active).map((p) => p.id),
    scorecards: groups.map((g) => ({
      id: g.id,
      name: g.name.replace('Group', 'Card'),
      playerIds: g.playerIds
    })),
    scores,
    completed: false
  };
}


function App() {
  const [state, setState] = useState<AppState>(() =>
    loadJson(STORAGE_KEY, {
      players: initialPlayers,
      scores: {},
      groups: defaultGroups,
      currentHole: 1
    })
  );

  const [activeTab, setActiveTab] = useState<Tab>('round');
  const [dbConfig, setDbConfig] = useState<SupabaseConfig>(() =>
    loadJson(SUPABASE_CONFIG_KEY, { url: '', anonKey: '' })
  );
  const [dbMessage, setDbMessage] = useState('Live database is not connected yet.');
  const [groupId, setGroupId] = useState(state.groups[0]?.id ?? 'g1');
  const [importText, setImportText] = useState('');
  const [importMessage, setImportMessage] = useState('');

  const activeGroup = state.groups.find((g) => g.id === groupId) ?? state.groups[0];
  const activePlayers = state.players.filter((p) => activeGroup?.playerIds.includes(p.id));
  const board = useMemo(
    () => leaderboard(state.players, blackBearCourse, state.scores),
    [state.players, state.scores]
  );
  const skinRows = useMemo(
    () => skins(state.players, blackBearCourse, state.scores),
    [state.players, state.scores]
  );
  const currentRound = useMemo(
  () => createCurrentRound(state.players, state.scores, state.groups),
  [state.players, state.scores, state.groups]
);
  const hole = blackBearCourse.find((h) => h.number === state.currentHole) ?? blackBearCourse[0];

  function patch(next: Partial<AppState>) {
    setState((current) => {
      const updated = { ...current, ...next };
      saveJson(STORAGE_KEY, updated);
      return updated;
    });
  }

  function saveDbConfig(next: SupabaseConfig) {
    setDbConfig(next);
    saveJson(SUPABASE_CONFIG_KEY, next);
  }

  async function checkLiveDatabase() {
    setDbMessage('Checking Supabase connection...');
    const result = await testSupabaseConnection(dbConfig);
    setDbMessage(result.message);
  }

  async function syncPlayersToLiveDb() {
    setDbMessage('Pushing players to Supabase...');
    const result = await pushPlayers(dbConfig, state.players);
    setDbMessage(result.message);
  }

  function setScore(playerId: string, gross: number) {
    patch({
      scores: {
        ...state.scores,
        [playerId]: {
          ...(state.scores[playerId] ?? {}),
          [hole.number]: gross
        }
      }
    });
  }

  function toggleCheckedInPlayer(playerId: string) {
  patch({
    players: state.players.map((player) =>
      player.id === playerId
        ? { ...player, active: !player.active }
        : player
    )
  });
}
function addScorecard() {
  const nextNumber = state.groups.length + 1;

  patch({
    groups: [
      ...state.groups,
      {
        id: `card-${nextNumber}`,
        name: `Card ${nextNumber}`,
        playerIds: [],
        scorekeeperIds: []
      }
    ]
  });
}

function addPlayerToScorecard(scorecardId: string, playerId: string) {
  patch({
    groups: state.groups.map((group) =>
      group.id === scorecardId
        ? { ...group, playerIds: [...group.playerIds, playerId] }
        : group
    )
  });
}
  
  function importRoundScores() {
    try {
      const parsed = JSON.parse(importText) as ScoreMap;
      patch({ scores: parsed, currentHole: 1 });
      setImportMessage('Round scores imported successfully.');
      setActiveTab('leaderboard');
    } catch {
      setImportMessage('Import failed. Check that the JSON is valid.');
    }
  }
function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function findPlayerIdByName(name: string) {
  const match = state.players.find(
    (player) => normalizeName(player.name) === normalizeName(name)
  );

  return match?.id ?? null;
}

function applyPairings(groups: Group[]) {
  patch({ groups });
}
  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Black Bear Saturday Game</p>
          <h1>Bear Tracker</h1>
          <p>
            Live scoring foundation · Hole {state.currentHole} ·{' '}
            {state.players.filter((p) => p.active).length} active players
          </p>
        </div>
        <button onClick={() => patch({ scores: {}, currentHole: 1 })}>Reset Test Round</button>
      </header>

      <nav className="tabs">
        {(['round', 'checkin', 'pairings', 'scorecards', 'score', 'leaderboard', 'skins', 'import', 'admin', 'live'] as const).map((tab) => (
          <button
            key={tab}
            className={activeTab === tab ? 'active' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </nav>
{activeTab === 'round' && <SaturdayRound round={currentRound} />}
{activeTab === 'checkin' && (
  <PlayerCheckIn
    players={state.players}
    checkedInPlayerIds={state.players.filter((p) => p.active).map((p) => p.id)}
    onTogglePlayer={toggleCheckedInPlayer}
  />
)}
{activeTab === 'pairings' && (
  <PairingsImport
    onApplyPairings={applyPairings}
    findPlayerIdByName={findPlayerIdByName}
  />
)}
{activeTab === 'scorecards' && (
  <ScorecardBuilder
    players={state.players}
    scorecards={state.groups}
    onAddScorecard={addScorecard}
    onAddPlayerToScorecard={addPlayerToScorecard}
  />
)}
      {activeTab === 'score' && (
        <section className="card">
          <div className="row">
            <h2>Scorecard Entry</h2>
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
              {state.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name.replace('Group', 'Card')}
                </option>
              ))}
            </select>
          </div>

          <h3>
            Hole {hole.number} · Par {hole.par} · Stroke Index {hole.strokeIndex}
          </h3>

          <div className="score-grid">
            {activePlayers.map((player) => (
              <div className="score-row" key={player.id}>
                <strong>{player.name}</strong>
                <span>
                  HDCP {player.handicap} · Quota {player.quota}
                </span>
                <div className="score-buttons">
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((gross) => (
                    <button
                      key={gross}
                      className={state.scores[player.id]?.[hole.number] === gross ? 'selected' : ''}
                      onClick={() => setScore(player.id, gross)}
                    >
                      {gross}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="row footer-actions">
            <button
              disabled={state.currentHole <= 1}
              onClick={() => patch({ currentHole: state.currentHole - 1 })}
            >
              Previous Hole
            </button>
            <button
              disabled={state.currentHole >= 18}
              onClick={() => patch({ currentHole: state.currentHole + 1 })}
            >
              Next Hole
            </button>
          </div>
        </section>
      )}

      {activeTab === 'leaderboard' && (
        <section className="card">
          <h2>Live Leaderboard</h2>
          <table>
            <thead>
              <tr>
                <th>Pos</th>
                <th>Player</th>
                <th>Thru</th>
                <th>Pts</th>
                <th>Quota</th>
                <th>+/-</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r, index) => (
                <tr key={r.playerId}>
                  <td>{index + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.thru}</td>
                  <td>{r.points}</td>
                  <td>{r.quota}</td>
                  <td className={r.quotaDelta >= 0 ? 'good' : 'bad'}>
                    {r.quotaDelta > 0 ? '+' : ''}
                    {r.quotaDelta}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'skins' && (
        <section className="card">
          <h2>Net Skins</h2>
          <table>
            <thead>
              <tr>
                <th>Hole</th>
                <th>Status</th>
                <th>Winner</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {skinRows.map((s) => (
                <tr key={s.hole}>
                  <td>{s.hole}</td>
                  <td>{s.status}</td>
                  <td>{s.winnerName ?? '—'}</td>
                  <td>{s.netScore ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {activeTab === 'import' && (
        <section className="card">
          <h2>Import Round Scores</h2>
          <p>Paste a JSON score map below. Format: player ID, then hole number, then gross score.</p>

          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            rows={18}
            style={{ width: '100%', fontFamily: 'monospace' }}
            placeholder="Paste score JSON here..."
          />

          <div className="row footer-actions">
            <button onClick={importRoundScores}>Import Round</button>
            <button onClick={() => setImportText('')}>Clear Import Box</button>
            
          </div>

          {importMessage && <div className="status-box">{importMessage}</div>}
        </section>
      )}

      {activeTab === 'admin' && (
        <section className="card">
          <h2>Admin Snapshot</h2>
          <p>This sprint focuses on live local scoring. Drag-and-drop group editing and Supabase sync are next.</p>
          <pre>
            {JSON.stringify(
              {
                groups: state.groups,
                scoresEntered: Object.values(state.scores).reduce(
                  (sum, holes) => sum + Object.values(holes).filter((v) => typeof v === 'number').length,
                  0
                )
              },
              null,
              2
            )}
          </pre>
        </section>
      )}

      {activeTab === 'live' && (
        <section className="card">
          <h2>Live Database Setup</h2>
          <p>This sprint adds the Supabase foundation. Scoring still runs locally until the next live-sync sprint.</p>

          <label>
            Supabase Project URL
            <input
              value={dbConfig.url}
              placeholder="https://your-project.supabase.co"
              onChange={(e) => saveDbConfig({ ...dbConfig, url: e.target.value })}
            />
          </label>

          <label>
            Supabase anon public key
            <input
              value={dbConfig.anonKey}
              placeholder="eyJ..."
              onChange={(e) => saveDbConfig({ ...dbConfig, anonKey: e.target.value })}
            />
          </label>

          <div className="row footer-actions">
            <button onClick={checkLiveDatabase}>Test Connection</button>
            <button onClick={syncPlayersToLiveDb}>Push Local Players</button>
          </div>

          <div className="status-box">{dbMessage}</div>
        </section>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);