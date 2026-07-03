import { useEffect, useMemo, useState } from 'react';
import { blackBearCourse } from './data/course';
import { initialPlayers } from './data/players';
import { initialGroups } from './data/groups';
import type { Group, Player, PayoutSettings, QuotaPreview, Score, Session } from './types';
import { calculateResults, calculateSkins } from './lib/scoring';
import { loadJson, saveJson } from './lib/storage';
import { Login } from './components/Login';
import { PlayerAdmin } from './components/PlayerAdmin';
import { GroupAdmin } from './components/GroupAdmin';
import { ScoringPanel } from './components/ScoringPanel';
import { Leaderboard } from './components/Leaderboard';
import { SkinsPanel } from './components/SkinsPanel';
import { PayoutPanel } from './components/PayoutPanel';
import './styles.css';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => loadJson('players', initialPlayers));
  const [groups, setGroups] = useState<Group[]>(() => loadJson('groups', initialGroups));
  const [scores, setScores] = useState<Score[]>(() => loadJson('scores', []));
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>(() => loadJson('payoutSettings', { placePurse: 300, skinValue: 10 }));
  const [session, setSession] = useState<Session>(() => loadJson('session', null));
  const [tab, setTab] = useState<'scoring' | 'leaderboard' | 'skins' | 'payouts' | 'groups' | 'admin'>('scoring');
  const [hole, setHole] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => loadJson('selectedGroupId', initialGroups[0].id));

  useEffect(()=>saveJson('players', players), [players]);
  useEffect(()=>saveJson('groups', groups), [groups]);
  useEffect(()=>saveJson('scores', scores), [scores]);
  useEffect(()=>saveJson('session', session), [session]);
  useEffect(()=>saveJson('payoutSettings', payoutSettings), [payoutSettings]);
  useEffect(()=>saveJson('selectedGroupId', selectedGroupId), [selectedGroupId]);

  const results = useMemo(()=>calculateResults(players, blackBearCourse, scores), [players, scores]);
  const skins = useMemo(()=>calculateSkins(players, blackBearCourse, scores), [players, scores]);
  const currentHole = blackBearCourse.find(h=>h.hole===hole)!;
  const currentUser = session ? players.find(p=>p.id===session.playerId) : null;
  const canAdmin = !!session?.isAdmin;
  const scorerGroups = session ? groups.filter(g => g.scorekeeperIds.includes(session.playerId) || session.isAdmin) : [];
  const selectedGroup = groups.find(g => g.id === selectedGroupId) ?? scorerGroups[0] ?? groups[0];
  const canScoreSelectedGroup = !!session && (!!session.isAdmin || !!selectedGroup?.scorekeeperIds.includes(session.playerId));

  function saveScore(playerId: string, gross: number) {
    if (!canScoreSelectedGroup) return alert('Only this group’s scorekeeper or an admin can enter these scores.');
    setScores(prev => [...prev.filter(s => !(s.playerId===playerId && s.hole===hole)), {playerId, hole, gross}]);
  }

  function login(playerId: string, pin: string): boolean {
    const player = players.find(p => p.id === playerId && p.pin === pin);
    if (!player) return false;
    setSession({ playerId: player.id, isAdmin: !!player.isAdmin });
    const firstGroup = groups.find(g => g.scorekeeperIds.includes(player.id));
    if (firstGroup) setSelectedGroupId(firstGroup.id);
    setTab('scoring');
    return true;
  }

  function resetScores() {
    if (confirm('Clear all current-round scores on this device?')) setScores([]);
  }

  function applyQuotaUpdates(preview: QuotaPreview[]) {
    setPlayers(prev => prev.map(player => {
      const row = preview.find(p => p.playerId === player.id);
      return row ? { ...player, quota: row.nextQuota } : player;
    }));
    setScores([]);
    setTab('leaderboard');
    alert('Quota updates applied and current scores cleared for the next round.');
  }

  return <div className="app">
    <header><h1>Bear Tracker</h1><p>Real implementation v0.5 · Payouts, ties, and quota finalization</p><Login players={players} session={session} onLogin={login} onLogout={()=>setSession(null)} /></header>
    <nav className="tabs">
      <button className={tab==='scoring'?'active':''} onClick={()=>setTab('scoring')}>Group Scoring</button>
      <button className={tab==='leaderboard'?'active':''} onClick={()=>setTab('leaderboard')}>Leaderboard</button>
      <button className={tab==='skins'?'active':''} onClick={()=>setTab('skins')}>Skins</button>
      <button className={tab==='payouts'?'active':''} onClick={()=>setTab('payouts')}>Payouts</button>
      <button className={tab==='groups'?'active':''} onClick={()=>setTab('groups')}>Groups</button>
      <button className={tab==='admin'?'active':''} onClick={()=>setTab('admin')}>Players</button>
    </nav>
    <main className="grid">
      {tab === 'scoring' && <ScoringPanel players={players} groups={groups} scores={scores} selectedGroupId={selectedGroup?.id ?? selectedGroupId} hole={hole} currentHole={currentHole} currentUserName={currentUser?.name ?? null} canScoreSelectedGroup={canScoreSelectedGroup} scorerGroups={scorerGroups} isAdmin={!!session?.isAdmin} onGroupChange={setSelectedGroupId} onSaveScore={saveScore} onHoleChange={setHole} onResetScores={resetScores} />}
      {tab === 'leaderboard' && <Leaderboard results={results} />}
      {tab === 'skins' && <SkinsPanel players={players} skins={skins} />}
      {tab === 'payouts' && (canAdmin ? <PayoutPanel results={results} skins={skins} settings={payoutSettings} onSettingsChange={setPayoutSettings} onApplyQuotaUpdates={applyQuotaUpdates} /> : <section className="card full"><h2>Payouts</h2><p>Sign in as admin to preview payouts and finalize quota changes.</p></section>)}
      {tab === 'groups' && (canAdmin ? <GroupAdmin players={players} groups={groups} onChange={setGroups} /> : <section className="card full"><h2>Groups</h2><p>Sign in as admin to assign groups and scorekeepers.</p></section>)}
      {tab === 'admin' && (canAdmin ? <PlayerAdmin players={players} onChange={setPlayers} /> : <section className="card full"><h2>Players</h2><p>Sign in as an admin to edit players. Kevin Baker has admin access in the seed data.</p></section>)}
    </main>
  </div>
}
