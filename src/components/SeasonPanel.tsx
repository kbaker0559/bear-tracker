import type { Player, RoundRecord } from '../types';

type Props = {
  history: RoundRecord[];
  players: Player[];
  onExport: () => void;
  onImport: (file: File) => void;
  onClearHistory: () => void;
};

export function SeasonPanel({ history, players, onExport, onImport, onClearHistory }: Props) {
  const moneyRows = players.map(player => {
    const records = history.flatMap(round => round.players.filter(p => p.playerId === player.id));
    return {
      player,
      rounds: records.length,
      placeMoney: records.reduce((sum, r) => sum + r.placeMoney, 0),
      skinMoney: records.reduce((sum, r) => sum + r.skinMoney, 0),
      totalMoney: records.reduce((sum, r) => sum + r.totalMoney, 0),
      skins: records.reduce((sum, r) => sum + (r.skinMoney > 0 ? 1 : 0), 0),
      avgDiff: records.length ? records.reduce((sum, r) => sum + r.quotaDiff, 0) / records.length : 0
    };
  }).filter(row => row.rounds > 0 || row.player.active).sort((a,b)=> b.totalMoney - a.totalMoney || b.avgDiff - a.avgDiff || a.player.name.localeCompare(b.player.name));

  const latest = history[0];

  return <section className="card full">
    <div className="sectionHeader">
      <div>
        <h2>Season History & Backups</h2>
        <p>Finalized rounds are saved locally on this device for now. Export a backup after every Saturday until live database sync is added.</p>
      </div>
      <div className="progressPill">{history.length} finalized round{history.length === 1 ? '' : 's'}</div>
    </div>

    <div className="nav">
      <button onClick={onExport}>Export Backup</button>
      <label className="fileButton">Restore Backup<input type="file" accept="application/json" onChange={e => { const file = e.target.files?.[0]; if (file) onImport(file); e.currentTarget.value = ''; }} /></label>
      <button disabled={!history.length} onClick={onClearHistory}>Clear History</button>
    </div>

    {latest && <div className="latestBox">
      <h3>Latest Finalized Round</h3>
      <p><b>{latest.label}</b> · {latest.date} · {latest.playerCount} players · Place money ${latest.totalPlaceMoney} · Skin money ${latest.totalSkinMoney}</p>
    </div>}

    <h3>Season Money List</h3>
    <table><thead><tr><th>Player</th><th>Rounds</th><th>Place $</th><th>Skin $</th><th>Total $</th><th>Avg +/-</th></tr></thead><tbody>{moneyRows.map(row => <tr key={row.player.id}>
      <td>{row.player.name}</td>
      <td>{row.rounds}</td>
      <td>${row.placeMoney}</td>
      <td>${row.skinMoney}</td>
      <td><b>${row.totalMoney}</b></td>
      <td className={row.avgDiff >= 0 ? 'good' : 'bad'}>{row.avgDiff >= 0 ? '+' : ''}{row.avgDiff.toFixed(1)}</td>
    </tr>)}</tbody></table>

    <h3>Round Archive</h3>
    {history.length ? <div className="roundList">{history.map(round => <details key={round.id} className="roundCard">
      <summary><b>{round.label}</b> · {round.date} · {round.playerCount} players</summary>
      <table><thead><tr><th>Player</th><th>Gross</th><th>Net</th><th>Pts</th><th>+/-</th><th>$</th><th>Quota</th></tr></thead><tbody>{round.players.slice().sort((a,b)=>b.totalMoney-a.totalMoney || b.quotaDiff-a.quotaDiff).map(p => <tr key={p.playerId}>
        <td>{p.playerName}</td><td>{p.gross}</td><td>{p.net}</td><td>{p.points}</td><td className={p.quotaDiff>=0?'good':'bad'}>{p.quotaDiff>0?'+':''}{p.quotaDiff}</td><td>${p.totalMoney}</td><td>{p.quotaBefore} → {p.quotaAfter}</td>
      </tr>)}</tbody></table>
    </details>)}</div> : <p>No finalized rounds yet.</p>}
  </section>;
}
