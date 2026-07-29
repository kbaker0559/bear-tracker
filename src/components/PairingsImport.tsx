import { useMemo, useState } from 'react';
import type { Group, Player } from '../types';
import { matchPlayer } from '../services/playerMatcher';
import { parsePairingsEmail } from '../utils/parsePairings';

type Props = {
  players: Player[];
  onApplyPairings: (groups: Group[], tournamentDate: string) => void;
};

export default function PairingsImport({
  players,
  onApplyPairings
}: Props) {
  const [text, setText] = useState('');
  const [tournamentDate, setTournamentDate] = useState('');
  const [acceptedMatches, setAcceptedMatches] = useState<
    Record<string, string>
  >({});

  const parsed = useMemo(() => parsePairingsEmail(text), [text]);

  const reviewedGroups = useMemo(
    () =>
      parsed.map((group) => ({
        ...group,
        reviewedPlayers: group.players.map((player) => ({
          ...player,
          match: matchPlayer(player.name, players)
        }))
      })),
    [parsed, players]
  );

  function matchKey(groupNumber: number, playerName: string): string {
    return `${groupNumber}:${playerName}`;
  }

  function resolvedPlayerId(
    groupNumber: number,
    playerName: string,
    automaticPlayerId: string | null
  ): string | null {
    return (
      acceptedMatches[matchKey(groupNumber, playerName)] ??
      automaticPlayerId
    );
  }

  const unresolvedPlayers = reviewedGroups.flatMap((group) =>
    group.reviewedPlayers.filter((player) => {
      if (player.match.status === 'unmatched') {
        return true;
      }

      if (player.match.status === 'suggested') {
        const key = matchKey(group.groupNumber, player.name);
        return !acceptedMatches[key];
      }

      return false;
    })
  );

  const groups: Group[] = reviewedGroups.map((group) => ({
    id: `card-${group.groupNumber}`,
    name: `Card ${group.groupNumber}`,
    playerIds: group.reviewedPlayers
      .map((player) =>
        resolvedPlayerId(
          group.groupNumber,
          player.name,
          player.match.playerId
        )
      )
      .filter((id): id is string => Boolean(id)),
    scorekeeperIds: []
  }));

  function acceptSuggestedMatch(
    groupNumber: number,
    importedName: string,
    playerId: string
  ) {
    const key = matchKey(groupNumber, importedName);

    setAcceptedMatches((current) => ({
      ...current,
      [key]: playerId
    }));
  }

  function clearImport() {
    setText('');
    setAcceptedMatches({});
  }

  function applyPairings() {
  if (unresolvedPlayers.length > 0) return;

  if (!tournamentDate) {
    window.alert('Select the Round Date before applying pairings.');
    return;
  }

  onApplyPairings(groups, tournamentDate);
}

  return (
    <section className="card">
      <h2>Round Setup — Import Pairings</h2>

      <p>
        Paste the pairings table, review every player match, and then
        create the tournament and scorecards.
      </p>

      <label style={{ display: 'block', marginBottom: '1rem' }}>
  <strong>Round Date</strong>

  <input
    type="date"
    value={tournamentDate}
    onChange={(event) => setTournamentDate(event.target.value)}
    style={{ display: 'block', marginTop: '0.35rem' }}
  />

  <small style={{ display: 'block', marginTop: '0.35rem' }}>
    Select the Saturday these pairings will be played.
  </small>
</label>

      <textarea
        value={text}
        onChange={(event) => {
          setText(event.target.value);
          setAcceptedMatches({});
        }}
        rows={14}
        style={{ width: '100%', fontFamily: 'monospace' }}
        placeholder="Paste pairings here..."
      />

      <div className="row footer-actions">
        <button
          onClick={applyPairings}
          disabled={
            !tournamentDate || parsed.length === 0 || unresolvedPlayers.length > 0
          }
        >
          Apply Pairings
        </button>

        <button onClick={clearImport}>Clear</button>
      </div>

      {parsed.length > 0 && (
        <p>
          <strong>{parsed.length}</strong> scorecards ·{' '}
          <strong>
            {reviewedGroups.reduce(
              (sum, group) =>
                sum + group.reviewedPlayers.length,
              0
            )}
          </strong>{' '}
          players ·{' '}
          <strong>{unresolvedPlayers.length}</strong> need attention
        </p>
      )}

      <h3>Review Import</h3>

      {reviewedGroups.map((group) => (
        <div key={group.groupNumber} className="score-row">
          <strong>
            Card {group.groupNumber} ·{' '}
            {group.teeTime || 'No tee time found'}
          </strong>

          <ul>
            {group.reviewedPlayers.map((player) => {
              const key = matchKey(
                group.groupNumber,
                player.name
              );

              const suggestionAccepted =
                Boolean(acceptedMatches[key]);

              return (
                <li key={key}>
                  {player.match.status === 'exact' && '✓ '}
                  {player.match.status === 'alias' && '✓ '}
                  {player.match.status === 'suggested' &&
                    (suggestionAccepted ? '✓ ' : '⚠ ')}
                  {player.match.status === 'unmatched' && '✖ '}

                  {player.name} · {player.tee} · HDCP{' '}
                  {player.handicap}

                  {player.match.status === 'alias' && (
                    <>
                      {' '}
                      — matched to {player.match.matchedName}
                    </>
                  )}

                  {player.match.status === 'suggested' &&
                    !suggestionAccepted && (
                      <>
                        {' '}
                        — possible match:{' '}
                        {player.match.matchedName}
                        <button
                          type="button"
                          onClick={() => {
                            if (player.match.playerId) {
                              acceptSuggestedMatch(
                                group.groupNumber,
                                player.name,
                                player.match.playerId
                              );
                            }
                          }}
                          style={{ marginLeft: '0.5rem' }}
                        >
                          Accept Match
                        </button>
                      </>
                    )}

                  {player.match.status === 'suggested' &&
                    suggestionAccepted && (
                      <>
                        {' '}
                        — matched to {player.match.matchedName}
                      </>
                    )}

                  {player.match.status === 'unmatched' && (
                    <> — no roster match</>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {unresolvedPlayers.length > 0 && (
        <div className="status-box">
          Resolve all suggested or unmatched players before
          applying the pairings.
        </div>
      )}
    </section>
  );
}