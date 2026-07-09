import { useState } from 'react';
import AppShell from './components/AppShell';
import HomeWorkspace from './components/HomeWorkspace';
import OperationsWorkspace from './components/OperationsWorkspace';

type Workspace = 'home' | 'operations' | 'tournament' | 'finance' | 'league' | 'admin';

export default function App() {
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace>('home');

  const expectedCount = 0;
  const checkedInCount = 0;
  const paidCount = 0;
  const scorecardCount = 0;

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Black Bear Saturday Game</p>
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
          expectedCount={expectedCount}
          checkedInCount={checkedInCount}
          paidCount={paidCount}
        />
      )}

      {currentWorkspace === 'tournament' && (
        <section className="card">
          <h2>Tournament Workspace</h2>
          <p>Live scoring, leaderboard, skins, greenies, and review will live here.</p>
        </section>
      )}

      {currentWorkspace === 'finance' && (
        <section className="card">
          <h2>Finance Workspace</h2>
          <p>Payouts, owed players, hole-in-one fund, extra fund, and financial checks will live here.</p>
        </section>
      )}

      {currentWorkspace === 'league' && (
        <section className="card">
          <h2>League Manager Workspace</h2>
          <p>Signups, pairings, tee times, and communications will live here.</p>
        </section>
      )}

      {currentWorkspace === 'admin' && (
        <section className="card">
          <h2>Administration Workspace</h2>
          <p>Players, rules, GHIN, courses, seasons, and reports will live here.</p>
        </section>
      )}
    </main>
  );
}