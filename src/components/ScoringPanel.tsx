import type { Group, Hole, Player, Score } from '../types';
import { holeScoreDetail } from '../lib/scoring';

type Props = {
  players: Player[];
  groups: Group[];
  scores: Score[];
  selectedGroupId: string;
  hole: number;
  currentHole: Hole;
  currentUserName: string | null;
  canScoreSelectedGroup: boolean;
  scorerGroups: Group[];
  isAdmin: boolean;
  onGroupChange: (groupId: string) => void;
  onSaveScore: (playerId: string, gross: number) => void;
  onHoleChange: (hole: number) => void;
  onResetScores: () => void;
};

export function ScoringPanel({ players, groups, scores, selectedGroupId, hole, currentHole, currentUserName, canScoreSelectedGroup, scorerGroups, isAdmin, onGroupChange, onSaveScore, onHoleChange, onResetScores }: Props) {
  const groupOptions = isAdmin ? groups : scorerGroups;
  const selectedGroup = groups.find(g => g.id === selectedGroupId) ?? groupOptions[0] ?? groups[0];
  const groupPlayers = selectedGroup?.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[] ?? [];
  const completedOnHole = groupPlayers.filter(p => scores.some(s => s.playerId === p.id && s.hole === hole)).length;

  return <section className="card full">
    <div className="sectionHeader">
      <div>
        <h2>Group Score Entry</h2>
        <p>{currentUserName ? `Signed in as ${currentUserName}` : 'Sign in to enter scores.'}</p>
      </div>
      <label>Group <select value={selectedGroup?.id ?? ''} onChange={e=>onGroupChange(e.target.value)}>{groupOptions.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select></label>
    </div>

    <div className="holeHero">
      <div><span>Hole</span><strong>{hole}</strong></div>
      <div><span>Par</span><strong>{currentHole.par}</strong></div>
      <div><span>Stroke Index</span><strong>{currentHole.strokeIndex}</strong></div>
      <div><span>Scores Entered</span><strong>{completedOnHole}/{groupPlayers.length}</strong></div>
    </div>

    {!canScoreSelectedGroup && <p className="warning">You can view this card, but only the assigned scorekeeper or admin can save scores.</p>}
    {groupPlayers.length === 0 && <p className="warning">This group has no players yet. Use the Groups tab to assign players.</p>}

    <div className="scoreRows">{groupPlayers.map(p=>{
      const detail = holeScoreDetail(p, currentHole, scores);
      return <div className="scoreRow" key={p.id}>
        <div className="scorePlayerLine">
          <div><b>{p.name}</b><span>HDCP {p.handicap} · Quota {p.quota} · Gets {detail.strokes} stroke{detail.strokes!==1?'s':''}</span></div>
          <div className="scoreSummary">{detail.gross ? <>Gross {detail.gross} · Net {detail.net} · {detail.points} pts</> : 'No score'}</div>
        </div>
        <div className="buttons">{[2,3,4,5,6,7,8,9,10].map(n=><button disabled={!canScoreSelectedGroup} className={detail.gross===n?'selected':''} onClick={()=>onSaveScore(p.id,n)} key={n}>{n}</button>)}</div>
        <div className="netPreview">{detail.label}</div>
      </div>
    })}</div>

    <div className="nav"><button disabled={hole===1} onClick={()=>onHoleChange(hole-1)}>Previous</button><button disabled={hole===18} onClick={()=>onHoleChange(hole+1)}>Next Hole</button><button onClick={onResetScores}>Reset Scores</button></div>
  </section>;
}
