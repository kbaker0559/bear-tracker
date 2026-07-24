type Workspace = 'home' | 'operations' | 'tournament' | 'results' | 'finance' | 'quotas' | 'finalize' | 'league' | 'admin';

type Props = {
  activeWorkspace: Workspace;
  onChangeWorkspace: (workspace: Workspace) => void;
};

const workspaces: { id: Workspace; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'operations', label: 'Operations' },
  { id: 'tournament', label: 'Tournament' },
  { id: 'results', label: 'Results' },
  { id: 'finance', label: 'Treasurer' },
  { id: 'quotas', label: 'Quota Updates' },
  { id: 'finalize', label: 'Finalize' },
  { id: 'league', label: 'League Manager' },
  { id: 'admin', label: 'Administration' }
];

export default function AppShell({ activeWorkspace, onChangeWorkspace }: Props) {
  return (
    <nav className="tabs">
      {workspaces.map((workspace) => (
        <button
          key={workspace.id}
          className={activeWorkspace === workspace.id ? 'active' : ''}
          onClick={() => onChangeWorkspace(workspace.id)}
        >
          {workspace.label}
        </button>
      ))}
    </nav>
  );
}