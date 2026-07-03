import type { Player, SkinResult } from '../types';

type Props = { players: Player[]; skins: SkinResult[] };

export function SkinsPanel({ players, skins }: Props) {
  const won = skins.filter(s => s.status === 'won').length;
  const cancelled = skins.filter(s => s.status === 'no-skin').length;
  const pending = skins.filter(s => s.status === 'pending').length;
  return <section className="card full">
    <div className="sectionHeader"><div><h2>Net Skins</h2><p>Lowest unique net score wins. Ties cancel the skin. No carryovers.</p></div><div className="progressPill">{won} won · {cancelled} cancelled · {pending} pending</div></div>
    <div className="skins">{skins.map(s=>{
      const winner = players.find(p=>p.id===s.winnerId)?.name;
      return <div key={s.hole} className={s.status === 'won' ? 'skinWon' : s.status === 'no-skin' ? 'skinCancelled' : ''}><b>Hole {s.hole}</b> {s.status==='pending'?'Pending':s.status==='no-skin'?'No skin':winner} {s.netScore !== null && <span>Low net {s.netScore}</span>}</div>;
    })}</div>
  </section>;
}
