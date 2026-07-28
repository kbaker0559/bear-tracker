import type { TournamentSummary } from '../storage/tournamentRepository';

type Props = {
  tournaments: TournamentSummary[];
  currentTournamentId: string;
  onOpen: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string) => void;
  onArchive: (id: string, archived: boolean) => void;
  onDelete: (id: string) => void;
  readOnly?: boolean;
  allowRename?: boolean;
};

export default function TournamentLibrary({
  tournaments,
  currentTournamentId,
  onOpen,
  onDuplicate,
  onRename,
  onArchive,
  onDelete,
  readOnly = false,
  allowRename = false
}: Props) {
  const active = tournaments.filter((item) => !item.archived);
  const archived = tournaments.filter((item) => item.archived);

  function renderTournament(item: TournamentSummary) {
    const current = item.id === currentTournamentId;
    return (
      <div className="tournament-library-row" key={item.id}>
        <div>
          <div className="tournament-library-title">
            <strong>{item.name}</strong>
            {current && <span className="tournament-current-badge">Current</span>}
            {item.kind === 'development' && (
              <span className="tournament-development-badge">Development Copy</span>
            )}
          </div>
          <div className="tournament-library-meta">
            {item.roundDate} • {item.playerCount} players • {item.cardCount} cards • Saved{' '}
            {new Date(item.updatedAt).toLocaleString()}
          </div>
        </div>
        <div className="tournament-library-actions">
          {!current && <button type="button" onClick={() => onOpen(item.id)}>Open</button>}
          {(allowRename || !readOnly) && (
            <button type="button" onClick={() => onRename(item.id)}>Rename</button>
          )}
          {!readOnly && (
            <>
              <button type="button" onClick={() => onDuplicate(item.id)}>Duplicate</button>
              <button type="button" onClick={() => onArchive(item.id, !item.archived)}>
                {item.archived ? 'Unarchive' : 'Archive'}
              </button>
              <button type="button" onClick={() => onDelete(item.id)}>Delete</button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <section className="card tournament-library">
      <h2>Tournament Library</h2>
      <p>Repository Step 3: the tournament list and current selection are read from the verified repository.</p>
      {readOnly && (
        <p className="tournament-library-meta">Rename now writes through the verified repository. Duplicate, archive, and delete remain disabled until their own acceptance tests.</p>
      )}
      <h3>Active Tournaments</h3>
      {active.length === 0 ? <p>No active tournaments.</p> : active.map(renderTournament)}
      {archived.length > 0 && (
        <>
          <h3 style={{ marginTop: '1.5rem' }}>Archived Tournaments</h3>
          {archived.map(renderTournament)}
        </>
      )}
    </section>
  );
}
