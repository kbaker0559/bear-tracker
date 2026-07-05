import { useMemo, useState } from 'react';
import type { Player } from '../types/models';
import { Card } from '../components/Card';

type LoginProps = {
  players: Player[];
  onLogin: (player: Player) => void;
};

export function Login({ players, onLogin }: LoginProps) {
  const activePlayers = useMemo(() => players.filter((p) => p.active), [players]);
  const [playerId, setPlayerId] = useState(activePlayers[0]?.id ?? '');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const player = players.find((p) => p.id === playerId);
    if (!player || player.pin !== pin) {
      setError('That PIN does not match the selected player.');
      return;
    }
    setError('');
    onLogin(player);
  }

  return (
    <main className="layout narrow">
      <header className="hero centered">
        <div>
          <p className="eyebrow">Black Bear Saturday Game</p>
          <h1>Bear Tracker</h1>
          <p>Sign in with your player name and 4-digit PIN.</p>
        </div>
      </header>

      <Card title="Player Login">
        <form className="form-stack" onSubmit={submit}>
          <label>
            Player
            <select value={playerId} onChange={(e) => setPlayerId(e.target.value)}>
              {activePlayers.map((player) => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
          </label>
          <label>
            PIN
            <input
              value={pin}
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="1234"
              type="password"
            />
          </label>
          {error && <p className="error">{error}</p>}
          <button type="submit">Sign in</button>
        </form>
        <p className="muted">Temporary admin PIN: Kevin Baker / 1234. Change PINs in Admin → Players.</p>
      </Card>
    </main>
  );
}
