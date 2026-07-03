import type { Player, Session } from '../types';

type Props = {
  players: Player[];
  session: Session;
  onLogin: (playerId: string, pin: string) => boolean;
  onLogout: () => void;
};

export function Login({ players, session, onLogin, onLogout }: Props) {
  if (session) {
    const player = players.find(p => p.id === session.playerId);
    return <div className="loginBar"><b>Signed in:</b> {player?.name ?? 'Unknown'} {session.isAdmin && <span className="badge">Admin</span>}<button onClick={onLogout}>Log out</button></div>;
  }

  return <form className="loginBar" onSubmit={(e) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const playerId = String(fd.get('playerId'));
    const pin = String(fd.get('pin'));
    if (!onLogin(playerId, pin)) alert('PIN did not match.');
  }}>
    <label>Player <select name="playerId">{players.filter(p=>p.active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
    <label>PIN <input name="pin" type="password" inputMode="numeric" pattern="[0-9]*" /></label>
    <button>Sign in</button>
  </form>;
}
