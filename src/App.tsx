import { useMemo, useState } from 'react';
import AppShell from './components/AppShell';
import HomeWorkspace from './components/HomeWorkspace';
import OperationsWorkspace from './components/OperationsWorkspace';
import { initialPlayers } from './data/players';
import type { Group, Player } from './types';
import './styles.css';

type Workspace =
  | 'home'
  | 'operations'
  | 'tournament'
  | 'finance'
  | 'league'
  | 'admin';

export default function App() {
  const [currentWorkspace, setCurrentWorkspace] =
    useState<Workspace>('home');

  const [players] = useState<Player[]>(initialPlayers);
  const [groups, setGroups] = useState<Group[]>([]);

  const expectedCount = useMemo(() => {
    const playerIds = new Set(
      groups.flatMap((group) => group.playerIds)
    );

    return playerIds.size;
  }, [groups]);

  const checkedInCount = 0;
  const paidCount = 0;
  const scorecardCount = groups.length;

  function normalizeName(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  function findPlayerIdByName(name: string): string | null {
    const match = players.find(
      (player) =>
        normalizeName(player.name) === normalizeName(name)
    );

    return match?.id ?? null;
  }

  function applyPairings(importedGroups: Group[]) {
    setGroups(importedGroups);
  }

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Golf League Operating System</p>
          <h1>Bear Tracker</h1>
          <p>League operations, scoring, payouts, and history.</p>
        </div>
      </header>

      <AppShell
        activeWorkspace={currentWorkspace}
        onChangeWorkspace={setCurrentWorkspace}
      />

      {currentWorkspace === 'home' && (
        <HomeWorkspace
          expectedCount={expectedCount}
          checkedInCount={checkedInCount}
          paidCount={paidCount}
          scorecardCount={scorecardCount}
        />
      )}

      {currentWorkspace === 'operations' && (
        <OperationsWorkspace
          players={players}
          groups={groups}
          expectedCount={expectedCount}
          checkedInCount={checkedInCount}
          paidCount={paidCount}
          onApplyPairings={applyPairings}
          findPlayerIdByName={findPlayerIdByName}
        />
      )}

      {currentWorkspace === 'tournament' && (
        <section className="card">
          <h2>Tournament Workspace</h2>
          <p>
            Live scoring, leaderboard, skins, greenies, H/A,
            and round review will live here.
          </p>
        </section>
      )}

      {currentWorkspace === 'finance' && (
        <section className="card">
          <h2>Finance Workspace</h2>
          <p>
            Payouts, owed players, the hole-in-one fund,
            the extra fund, and financial checks will live here.
          </p>
        </section>
      )}

      {currentWorkspace === 'league' && (
        <section className="card">
          <h2>League Manager Workspace</h2>
          <p>
            Signups, pairings, tee times, publishing,
            and communications will live here.
          </p>
        </section>
      )}

      {currentWorkspace === 'admin' && (
        <section className="card">
          <h2>Administration Workspace</h2>
          <p>
            Players, rules, GHIN, courses, seasons,
            and reports will live here.
          </p>
        </section>
      )}
    </main>
  );
}