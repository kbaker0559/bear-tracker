import { useState } from 'react';
import { parsePairingsEmail } from '../utils/parsePairings';

type Props = {
  onApplyPairings: (groups: { id: string; name: string; playerIds: string[]; scorekeeperIds: string[] }[]) => void;
  findPlayerIdByName: (name: string) => string | null;
};

export default function PairingsImport({ onApplyPairings, findPlayerIdByName }: Props) {
  const [text, setText] = useState('');
  const parsed = parsePairingsEmail(text);

  const groups = parsed.map((group) => ({
    id: `card-${group.groupNumber}`,
    name: `Card ${group.groupNumber}`,
    playerIds: group.players
      .map((player) => findPlayerIdByName(player.name))
      .filter((id): id is string => Boolean(id)),
    scorekeeperIds: []
  }));

  return (
    <section className="card">
      <h2>Import Pairings</h2>
      <p>Paste Paul&apos;s pairings table here, then preview and apply the scorecards.</p>

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={12}
        style={{ width: '100%', fontFamily: 'monospace' }}
        placeholder="Paste pairings here..."
      />

      <div className="row footer-actions">
        <button onClick={() => onApplyPairings(groups)} disabled={groups.length === 0}>
          Apply Pairings
        </button>
        <button onClick={() => setText('')}>Clear</button>
      </div>

      <h3>Preview</h3>

      {parsed.map((group) => (
        <div key={group.groupNumber} className="score-row">
          <strong>Card {group.groupNumber} · {group.teeTime || 'No tee time found'}</strong>
          <ul>
            {group.players.map((player) => (
              <li key={`${group.groupNumber}-${player.name}`}>
                {player.name} · {player.tee} · HDCP {player.handicap}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}