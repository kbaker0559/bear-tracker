import { useMemo, useState } from 'react';
import type { LeaguePlayer } from '../types/leaguePlayer';
import { getLeaguePlayerName } from '../types/leaguePlayer';
import {
  findPlayerIdentityMatches,
  generatePlayerIdentity
} from '../identity/playerIdentity';

type Props = {
  players: LeaguePlayer[];
};

export default function IdentityEngineTest({
  players
}: Props) {
  const sortedPlayers = useMemo(
    () =>
      [...players].sort(
        (a, b) =>
          a.lastName.localeCompare(b.lastName) ||
          a.firstName.localeCompare(b.firstName)
      ),
    [players]
  );

  const [selectedPlayerId, setSelectedPlayerId] =
    useState('');

  const [matchInput, setMatchInput] =
    useState('');

  const [submittedMatchInput, setSubmittedMatchInput] =
    useState('');

  const selectedPlayer =
    sortedPlayers.find(
      (player) => player.id === selectedPlayerId
    ) ?? null;

  const generatedAliases = selectedPlayer
    ? generatePlayerIdentity(
        selectedPlayer,
        players
      )
    : [];

  const identityMatches =
    submittedMatchInput.trim().length > 0
      ? findPlayerIdentityMatches(
          submittedMatchInput,
          players
        )
      : [];

  function runIdentityMatchTest() {
    setSubmittedMatchInput(matchInput.trim());
  }

  return (
    <section
      style={{
        marginTop: '1.5rem',
        padding: '1rem',
        border: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '0.75rem'
      }}
    >
      <h3>Identity Engine Test</h3>

      <p>
        Test generated aliases and player-name matching
        without changing permanent roster data.
      </p>

      <div>
        <h4>Alias Generator</h4>

        <label>
          <strong>Player</strong>

          <select
            value={selectedPlayerId}
            onChange={(event) =>
              setSelectedPlayerId(event.target.value)
            }
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '420px',
              marginTop: '0.4rem',
              padding: '0.6rem'
            }}
          >
            <option value="">
              Select a player...
            </option>

            {sortedPlayers.map((player) => (
              <option
                key={player.id}
                value={player.id}
              >
                {getLeaguePlayerName(player)}
              </option>
            ))}
          </select>
        </label>

        {selectedPlayer && (
          <div style={{ marginTop: '1rem' }}>
            <h4>Generated Aliases</h4>

            {generatedAliases.length === 0 ? (
              <p>No aliases were generated.</p>
            ) : (
              <ul>
                {generatedAliases.map((alias) => (
                  <li
                    key={alias.value.toLowerCase()}
                  >
                    {alias.value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <hr
        style={{
          margin: '1.5rem 0'
        }}
      />

      <div>
        <h4>Identity Match Test</h4>

        <label>
          <strong>Enter a player name or alias</strong>

          <input
            type="text"
            value={matchInput}
            onChange={(event) =>
              setMatchInput(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                runIdentityMatchTest();
              }
            }}
            placeholder="Example: K. Baker or Paul Sr."
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '420px',
              boxSizing: 'border-box',
              marginTop: '0.4rem',
              padding: '0.6rem'
            }}
          />
        </label>

        <button
          type="button"
          onClick={runIdentityMatchTest}
          disabled={matchInput.trim().length === 0}
          style={{
            marginTop: '0.75rem'
          }}
        >
          Match Player
        </button>

        {submittedMatchInput.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>
              Match Results for “{submittedMatchInput}”
            </h4>

            {identityMatches.length === 0 ? (
              <p>No player matches were found.</p>
            ) : (
              <>
                {identityMatches.length > 1 && (
                  <p>
                    <strong>
                      Multiple matches found. The input is
                      ambiguous.
                    </strong>
                  </p>
                )}

                {identityMatches.map((match) => (
                  <div
                    key={`${match.player.id}-${match.matchedBy}`}
                    className="score-row"
                    style={{
                      marginBottom: '0.75rem'
                    }}
                  >
                    <div>
                      <strong>
                        {getLeaguePlayerName(match.player)}
                      </strong>

                      <div>
                        Matched value: {match.matchedValue}
                      </div>

                      <div>
                        Matched by:{' '}
                        {match.matchedBy
                          .split('-')
                          .join(' ')}
                      </div>
                    </div>

                    <div
  style={{
    textAlign: 'right'
  }}
>
  <strong>
    {match.confidence}%
  </strong>

  <div
  style={{
    fontSize: '0.85rem',
    marginTop: '0.35rem'
  }}
>
  <strong>Evidence</strong>

  <ul
    style={{
      margin: '0.35rem 0 0 1rem',
      padding: 0
    }}
  >
    {match.evidence.map((item) => (
  <li key={`${item.type}-${item.description}`}>
    {item.description} · +{item.points}
  </li>
))}
  </ul>
</div>
</div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}