import { useEffect, useState } from 'react';
import type {
  LeaguePlayer,
  PlayerAlias,
} from '../types/leaguePlayer';
import { TEE_OPTIONS } from '../types/tee';
import type { Tee } from '../types/tee';

type AddLeaguePlayerDialogProps = {
  isOpen: boolean;
  player?: LeaguePlayer | null;
  onCancel: () => void;
  onSave: (player: {
  firstName: string;
  lastName: string;
  active: boolean;
  preferredTee?: Tee;
  aliases: PlayerAlias[];
}) => void;
};

export function AddLeaguePlayerDialog({
  isOpen,
  player,
  onCancel,
  onSave,
}: AddLeaguePlayerDialogProps) {
  const [firstName, setFirstName] = useState('');
const [lastName, setLastName] = useState('');
const [active, setActive] = useState(true);
const [preferredTee, setPreferredTee] = useState('');
const [aliasesText, setAliasesText] = useState('');
useEffect(() => {
  if (!isOpen) {
    return;
  }

  setFirstName(player?.firstName ?? '');
  setLastName(player?.lastName ?? '');
  setActive(player?.active ?? true);
  setPreferredTee(player?.preferredTee ?? '');
  setAliasesText(
  player?.aliases.map((alias) => alias.value).join(', ') ?? ''
);
}, [isOpen, player]);

if (!isOpen) {
  return null;
}

const canSave =
  firstName.trim().length > 0 &&
  lastName.trim().length > 0;
  function resetForm() {
  setFirstName('');
  setLastName('');
  setActive(true);
  setPreferredTee('');
  setAliasesText('');
}

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.45)',
        zIndex: 99999,
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 460,
          background: 'white',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.3)',
        }}
      >
        <h2>
  {player ? 'Edit League Player' : 'Add League Player'}
</h2>

        <div
          style={{
            display: 'grid',
            gap: 16,
            marginTop: 20,
          }}
        >
          <label>
            <div>First Name</div>

            <input
  type="text"
  value={firstName}
  onChange={(event) => setFirstName(event.target.value)}
  style={{
    width: '100%',
    boxSizing: 'border-box',
    padding: 10,
    marginTop: 6,
  }}
/>
          </label>

          <label>
            <div>Last Name</div>

            <input
  type="text"
  value={lastName}
  onChange={(event) => setLastName(event.target.value)}
  style={{
    width: '100%',
    boxSizing: 'border-box',
    padding: 10,
    marginTop: 6,
  }}
/>
          </label>
<label>
  <div>Aliases</div>

  <input
    type="text"
    value={aliasesText}
    onChange={(event) => setAliasesText(event.target.value)}
    placeholder="Example: Tony, Anthony"
    style={{
      width: '100%',
      boxSizing: 'border-box',
      padding: 10,
      marginTop: 6,
    }}
  />

  <div
    style={{
      marginTop: 4,
      fontSize: 12,
      color: '#666',
    }}
  >
    Separate multiple aliases with commas.
  </div>
</label>
          <label>
  <div>Default Tee</div>

  <select
  value={preferredTee}
  onChange={(event) => setPreferredTee(event.target.value)}
  style={{
    width: '100%',
    boxSizing: 'border-box',
    padding: 10,
    marginTop: 6,
  }}
>
  <option value="">Select a tee...</option>

  {TEE_OPTIONS.map((tee) => (
    <option key={tee} value={tee}>
      {tee}
    </option>
  ))}
</select>
</label>

<label
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }}
>
  <input
    type="checkbox"
    checked={active}
    onChange={(event) => setActive(event.target.checked)}
  />

  <span>Active Player</span>
</label>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 12,
            marginTop: 24,
          }}
        >
          <button
  type="button"
  onClick={() => {
    resetForm();
    onCancel();
  }}
>
  Cancel
</button>
          <button
  type="button"
  disabled={!canSave}
  onClick={() => {
  onSave({
  firstName: firstName.trim(),
  lastName: lastName.trim(),
  active,
  preferredTee: preferredTee === '' ? undefined : (preferredTee as Tee),
  aliases: aliasesText
  .split(',')
  .map((alias) => alias.trim())
  .filter((alias) => alias.length > 0)
  .map((alias) => ({
    value: alias,
    source: 'manual' as const,
  })),
});

  resetForm();
}}
>
  Save Player
</button>

          
        </div>
      </div>
    </div>
  );
}