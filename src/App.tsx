import { useEffect, useMemo, useState } from 'react';
import { blackBearCourse } from './data/course';
import { initialPlayers } from './data/players';
import { initialGroups } from './data/groups';
import type { Group, Player, PayoutSettings, QuotaPreview, RoundRecord, RoundSettings, Score, Session } from './types';
import { calculateResults, calculateSkins } from './lib/scoring';
import { loadJson, saveJson } from './lib/storage';
import { Login } from './components/Login';
import { PlayerAdmin } from './components/PlayerAdmin';
import { GroupAdmin } from './components/GroupAdmin';
import { ScoringPanel } from './components/ScoringPanel';
import { Leaderboard } from './components/Leaderboard';
import { SkinsPanel } from './components/SkinsPanel';
import { PayoutPanel } from './components/PayoutPanel';
import { SeasonPanel } from './components/SeasonPanel';
import { InstallPanel } from './components/InstallPanel';
import { RoundSetup } from './components/RoundSetup';
import './styles.css';

export default function App() {
  const [players, setPlayers] = useState<Player[]>(() => loadJson('players', initialPlayers));
  const [groups, setGroups] = useState<Group[]>(() => loadJson('groups', initialGroups));
  const [scores, setScores] = useState<Score[]>(() => loadJson('scores', []));
  const [history, setHistory] = useState<RoundRecord[]>(() => loadJson('history', []));
  const [payoutSettings, setPayoutSettings] = useState<PayoutSettings>(() => loadJson('payoutSettings', { placePurse: 300, skinValue: 10 }));
  const [roundSettings, setRoundSettings] = useState<RoundSettings>(() => loadJson('roundSettings', { name: 'Saturday Game', date: new Date().toISOString().slice(0, 10), courseName: 'Black Bear Golf Club', notes: '' }));
  const [session, setSession] = useState<Session>(() => loadJson('session', null));
  const [tab, setTab] = useState<'setup' | 'scoring' | 'leaderboard' | 'skins' | 'payouts' | 'season' | 'groups' | 'admin' | 'install'>('setup');
  const [hole, setHole] = useState(1);
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => loadJson('selectedGroupId', initialGroups[0].id));

  useEffect(()=>saveJson('players', players), [players]);
  useEffect(()=>saveJson('groups', groups), [groups]);
  useEffect(()=>saveJson('scores', scores), [scores]);
  useEffect(()=>saveJson('history', history), [history]);
  useEffect(()=>saveJson('session', session), [session]);
  useEffect(()=>saveJson('payoutSettings', payoutSettings), [payoutSettings]);
  useEffect(()=>saveJson('roundSettings', roundSettings), [roundSettings]);
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
    const allDone = results.length > 0 && results.every(r => r.thru === 18);
    if (!allDone) return alert('Finalize only after every active golfer has 18 holes entered.');

    const record: RoundRecord = {
      id: crypto.randomUUID(),
      date: new Date().toLocaleDateString(),
      label: `Saturday Round ${history.length + 1}`,
      playerCount: results.length,
      totalPlaceMoney: preview.reduce((sum, r) => sum + r.placeMoney, 0),
      totalSkinMoney: preview.reduce((sum, r) => sum + r.skinMoney, 0),
      players: results.map(result => {
        const row = preview.find(p => p.playerId === result.player.id)!;
        return {
          playerId: result.player.id,
          playerName: result.player.name,
          gross: result.gross,
          net: result.net,
          points: result.points,
          quotaDiff: result.quotaDiff,
          quotaBefore: row.currentQuota,
          quotaAfter: row.nextQuota,
          placeMoney: row.placeMoney,
          skinMoney: row.skinMoney,
          totalMoney: row.totalMoney
        };
      })
    };

    setHistory(prev => [record, ...prev]);
    setPlayers(prev => prev.map(player => {
      const row = preview.find(p => p.playerId === player.id);
      return row ? { ...player, quota: row.nextQuota } : player;
    }));
    setScores([]);
    setTab('season');
    alert('Round finalized, season history saved, quota updates applied, and current scores cleared for the next round.');
  }

  function exportBackup() {
    const backup = { exportedAt: new Date().toISOString(), version: 'real-v0.8', players, groups, scores, history, payoutSettings, roundSettings };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bear-tracker-backup-${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const backup = JSON.parse(String(reader.result));
        if (!backup.players || !backup.groups) throw new Error('Missing players or groups.');
        if (!confirm('Restore this backup? This will replace local Bear Tracker data on this device.')) return;
        setPlayers(backup.players);
        setGroups(backup.groups);
        setScores(backup.scores ?? []);
        setHistory(backup.history ?? []);
        setPayoutSettings(backup.payoutSettings ?? { placePurse: 300, skinValue: 10 });
        setRoundSettings(backup.roundSettings ?? { name: 'Saturday Game', date: new Date().toISOString().slice(0, 10), courseName: 'Black Bear Golf Club', notes: '' });
        alert('Backup restored.');
      } catch (error) {
        alert(`Could not restore backup: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    };
    reader.readAsText(file);
  }

  return <div className="app">
    <header><h1>Bear Tracker</h1><p>{roundSettings.name} · {roundSettings.courseName} · {roundSettings.date}</p><Login players={players} session={session} onLogin={login} onLogout={()=>setSession(null)} /></header>
    <nav className="tabs">
      <button className={tab==='setup'?'active':''} onClick={()=>setTab('setup')}>Round Setup</button>
      <button className={tab==='scoring'?'active':''} onClick={()=>setTab('scoring')}>Group Scoring</button>
      <button className={tab==='leaderboard'?'active':''} onClick={()=>setTab('leaderboard')}>Leaderboard</button>
      <button className={tab==='skins'?'active':''} onClick={()=>setTab('skins')}>Skins</button>
      <button className={tab==='payouts'?'active':''} onClick={()=>setTab('payouts')}>Payouts</button>
      <button className={tab==='season'?'active':''} onClick={()=>setTab('season')}>Season</button>
      <button className={tab==='groups'?'active':''} onClick={()=>setTab('groups')}>Groups</button>
      <button className={tab==='admin'?'active':''} onClick={()=>setTab('admin')}>Players</button>
      <button className={tab==='install'?'active':''} onClick={()=>setTab('install')}>Install</button>
    </nav>
    <main className="grid">
      {tab === 'setup' && (canAdmin ? <RoundSetup players={players} round={roundSettings} onRoundChange={setRoundSettings} onPlayersChange={setPlayers} /> : <section className="card full"><h2>Round Setup</h2><p>Sign in as admin to set up the Saturday round.</p></section>)}
      {tab === 'scoring' && <ScoringPanel players={players} groups={groups} scores={scores} selectedGroupId={selectedGroup?.id ?? selectedGroupId} hole={hole} currentHole={currentHole} currentUserName={currentUser?.name ?? null} canScoreSelectedGroup={canScoreSelectedGroup} scorerGroups={scorerGroups} isAdmin={!!session?.isAdmin} onGroupChange={setSelectedGroupId} onSaveScore={saveScore} onHoleChange={setHole} onResetScores={resetScores} />}
      {tab === 'leaderboard' && <Leaderboard results={results} />}
      {tab === 'skins' && <SkinsPanel players={players} skins={skins} />}
      {tab === 'payouts' && (canAdmin ? <PayoutPanel results={results} skins={skins} settings={payoutSettings} onSettingsChange={setPayoutSettings} onApplyQuotaUpdates={applyQuotaUpdates} /> : <section className="card full"><h2>Payouts</h2><p>Sign in as admin to preview payouts and finalize quota changes.</p></section>)}
      {tab === 'season' && (canAdmin ? <SeasonPanel history={history} players={players} onExport={exportBackup} onImport={importBackup} onClearHistory={()=>{ if(confirm('Clear season history on this device?')) setHistory([]); }} /> : <section className="card full"><h2>Season</h2><p>Sign in as admin to view season history and backups.</p></section>)}
      {tab === 'groups' && (canAdmin ? <GroupAdmin players={players} groups={groups} onChange={setGroups} /> : <section className="card full"><h2>Groups</h2><p>Sign in as admin to assign groups and scorekeepers.</p></section>)}
      {tab === 'admin' && (canAdmin ? <PlayerAdmin players={players} onChange={setPlayers} /> : <section className="card full"><h2>Players</h2><p>Sign in as an admin to edit players. Kevin Baker has admin access in the seed data.</p></section>)}
      {tab === 'install' && <InstallPanel />}
    </main>
  </div>
}
