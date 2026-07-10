import { useState } from 'react';
import AppShell from './components/AppShell';
import HomeWorkspace from './components/HomeWorkspace';
import OperationsWorkspace from './components/OperationsWorkspace';
import { initialPlayers } from './data/players';
import type { Group, Player } from './types';
import './styles.css';
import { createEmptyRound, type RoundBundle } from './engine/roundEngine';

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
   const [roundBundle, setRoundBundle] = useState<RoundBundle>(() =>
  createEmptyRound(new Date().toISOString().slice(0, 10))
); 

  const [players] = useState<Player[]>(initialPlayers);
  const [groups, setGroups] = useState<Group[]>([]);

  const expectedCount = roundBundle.round.expectedPlayerCount;

  const checkedInCount = roundBundle.round.checkedInCount;
const paidCount = roundBundle.round.paidCount;
const scorecardCount = roundBundle.round.scorecardCount;

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
function toggleCheckedIn(playerId: string) {
  setRoundBundle((current) => {
    const roundPlayers = current.roundPlayers.map((player) =>
      player.playerId === playerId
        ? {
            ...player,
            checkedIn: !player.checkedIn,
            status: !player.checkedIn
              ? ('checked-in' as const)
              : ('expected' as const)
          }
        : player
    );

    return {
      ...current,
      roundPlayers,
      round: {
        ...current.round,
        checkedInCount: roundPlayers.filter(
          (player) => player.checkedIn
        ).length,
        paidCount: roundPlayers.filter(
          (player) => player.paid
        ).length
      }
    };
  });
}

function togglePaid(playerId: string) {
  setRoundBundle((current) => {
    const roundPlayers = current.roundPlayers.map((player) =>
      player.playerId === playerId
        ? {
            ...player,
            paid: !player.paid,
            amountPaid: !player.paid ? 25 : 0
          }
        : player
    );

    return {
      ...current,
      roundPlayers,
      round: {
        ...current.round,
        checkedInCount: roundPlayers.filter((player) => player.checkedIn).length,
        paidCount: roundPlayers.filter((player) => player.paid).length
      }
    };
  });
} 

  const roundId = roundBundle.round.id;

  const roundPlayers = importedGroups.flatMap((group) =>
    group.playerIds.map((playerId) => ({
      roundId,
      playerId,
      status: 'expected' as const,
      checkedIn: false,
      paid: false,
      scorecardId: group.id,
      isEligibleForPlaces: true,
      isEligibleForSkins: true,
      isEligibleForGreenies: true,
      isEligibleForHorseAss: true,
      amountPaid: 0,
      amountWon: 0,
      amountOwed: 0
    }))
  );
  const expectedPlayerIds = roundBundle.roundPlayers.map(
  (player) => player.playerId
);

const checkedInPlayerIds = roundBundle.roundPlayers
  .filter((player) => player.checkedIn)
  .map((player) => player.playerId);

const paidPlayerIds = roundBundle.roundPlayers
  .filter((player) => player.paid)
  .map((player) => player.playerId);

  setRoundBundle((current) => ({
    ...current,
    round: {
      ...current.round,
      state: 'pairings-ready',
      expectedPlayerCount: roundPlayers.length,
      checkedInCount: 0,
      paidCount: 0,
      scorecardCount: importedGroups.length
    },
    roundPlayers
  }));
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