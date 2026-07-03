import type { PlayerResult, PayoutSettings, QuotaPreview, SkinResult } from '../types';
import { calculatePlacePayouts, calculateQuotaPreview, paidPlacesForPlayerCount, placePrizeAmounts } from '../lib/scoring';

type Props = {
  results: PlayerResult[];
  skins: SkinResult[];
  settings: PayoutSettings;
  onSettingsChange: (settings: PayoutSettings) => void;
  onApplyQuotaUpdates: (preview: QuotaPreview[]) => void;
};

export function PayoutPanel({ results, skins, settings, onSettingsChange, onApplyQuotaUpdates }: Props) {
  const completed = results.filter(r => r.thru === 18);
  const placesPaid = paidPlacesForPlayerCount(completed.length);
  const placeAmounts = placePrizeAmounts(settings.placePurse, placesPaid);
  const placePayouts = calculatePlacePayouts(results, settings.placePurse);
  const preview = calculateQuotaPreview(results, skins, settings);
  const allDone = results.length > 0 && results.every(r => r.thru === 18);
  const skinCount = skins.filter(s => s.status === 'won').length;

  return <section className="card full">
    <div className="sectionHeader">
      <div>
        <h2>Payouts & Quota Preview</h2>
        <p>Place money controls who is eligible for quota increases. Negative quota changes still apply even if a golfer is not in the money.</p>
      </div>
      <div className="progressPill">{completed.length}/{results.length} finished</div>
    </div>

    <div className="settingsGrid">
      <label>Place purse $<input type="number" min="0" value={settings.placePurse} onChange={e=>onSettingsChange({...settings, placePurse: Number(e.target.value) || 0})} /></label>
      <label>Skin value $<input type="number" min="0" value={settings.skinValue} onChange={e=>onSettingsChange({...settings, skinValue: Number(e.target.value) || 0})} /></label>
      <div className="statBox"><span>Places Paid</span><strong>{placesPaid || 'N/A'}</strong><small>9-15 players pays 4 · 16+ pays 5</small></div>
      <div className="statBox"><span>Skins Won</span><strong>{skinCount}</strong><small>Net only · ties cancel</small></div>
    </div>

    <h3>Place Prize Table</h3>
    {placesPaid ? <div className="pillRow">{placeAmounts.map((amount, i)=><span className="pill" key={i}>{i+1}{suffix(i+1)}: ${amount}</span>)}</div> : <p className="warning">Place payouts start at 9 completed players.</p>}

    <h3>Place Payouts</h3>
    {placePayouts.length ? <table><thead><tr><th>Place(s)</th><th>Player(s)</th><th>Each</th></tr></thead><tbody>{placePayouts.map(p=><tr key={p.placeLabel}><td>{p.placeLabel}</td><td>{p.playerIds.map(id => results.find(r=>r.player.id===id)?.player.name).join(', ')}</td><td>${p.amountEach}</td></tr>)}</tbody></table> : <p>No place payouts yet.</p>}

    <h3>Quota Changes & Money</h3>
    <table><thead><tr><th>Player</th><th>Pts</th><th>+/-</th><th>Place $</th><th>Skin $</th><th>Total $</th><th>Quota</th><th>Change</th><th>Next</th></tr></thead><tbody>{preview.map(row=>{
      const result = results.find(r=>r.player.id===row.playerId)!;
      return <tr key={row.playerId}>
        <td>{result.player.name}</td>
        <td>{row.points}</td>
        <td className={row.quotaDiff>=0?'good':'bad'}>{row.quotaDiff>0?'+':''}{row.quotaDiff}</td>
        <td>${row.placeMoney}</td>
        <td>${row.skinMoney}</td>
        <td><b>${row.totalMoney}</b></td>
        <td>{row.currentQuota}</td>
        <td className={row.adjustment>=0?'good':'bad'}>{row.adjustment>0?'+':''}{row.adjustment}</td>
        <td>{row.nextQuota}</td>
      </tr>;
    })}</tbody></table>

    {!allDone && <p className="warning">Finalize should wait until all selected golfers have 18 holes entered.</p>}
    <div className="nav"><button disabled={!allDone} onClick={()=>{ if(confirm('Apply quota updates for this round on this device? Make a backup first if needed.')) onApplyQuotaUpdates(preview); }}>Finalize Round & Apply Quotas</button></div>
  </section>;
}

function suffix(n: number) {
  if (n === 1) return 'st';
  if (n === 2) return 'nd';
  if (n === 3) return 'rd';
  return 'th';
}
