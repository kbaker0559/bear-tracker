import type { Player } from '../types/models';

type LoginProps = {
  players: Player[];
  onLogin: (player: Player) => void;
};

export function Login({ players, onLogin }: LoginProps) {
  function submit(formData: FormData) {
    const playerId = String(formData.get('playerId') ?? '');
    const pin = String(formData.get('pin') ?? '').trim();
    const player = players.find(item => item.id === playerId && item.pin === pin);
    if (!player) {
      window.alert('That PIN did not match the selected golfer.');
      return;
    }
    onLogin(player);
  }

  return (
    <section className="card login-card">
      <h2>PIN Login</h2>
      <p>Choose your name and enter your 4-digit PIN. Kevin is seeded as admin with PIN 1234 for testing.</p>
      <form action={submit} className="form-grid">
        <label>
          Golfer
          <select name="playerId" defaultValue={players.find(p => p.isAdmin)?.id ?? players[0]?.id}>
            {players.filter(player => player.active).map(player => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
        </label>
        <label>
          PIN
          <input name="pin" inputMode="numeric" maxLength={6} placeholder="1234" />
        </label>
        <button type="submit">Sign In</button>
      </form>
    </section>
  );
}
