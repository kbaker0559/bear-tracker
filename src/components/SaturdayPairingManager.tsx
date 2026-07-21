import { useMemo, useState } from 'react';
import type { Group, Player } from '../types';

type Props = {
  groups: Group[];
  players: Player[];

  onMovePlayer: (
    playerId: string,
    fromGroupId: string,
    toGroupId: string
  ) => void;

  onSwapPlayers: (
    firstPlayerId: string,
    secondPlayerId: string
  ) => void;

  onChangeScorekeeper: (
    groupId: string,
    playerId: string
  ) => void;
};

type PlayerAction = 'move' | 'swap' | null;

export default function SaturdayPairingManager({
  groups,
  players,
  onMovePlayer,
  onSwapPlayers,
  onChangeScorekeeper
}: Props) {
  const [activePlayerId, setActivePlayerId] =
    useState<string | null>(null);

  const [activeAction, setActiveAction] =
    useState<PlayerAction>(null);

  const [destinationGroupId, setDestinationGroupId] =
    useState('');

  const [swapPlayerId, setSwapPlayerId] =
    useState('');

  const activePlayer =
    players.find(
      (player) => player.id === activePlayerId
    ) ?? null;

  const activeGroup = useMemo(
    () =>
      groups.find((group) =>
        activePlayerId
          ? group.playerIds.includes(activePlayerId)
          : false
      ) ?? null,
    [groups, activePlayerId]
  );

  const swapOptions = useMemo(() => {
    if (!activeGroup) {
      return [];
    }

    return groups
      .filter((group) => group.id !== activeGroup.id)
      .flatMap((group) =>
        group.playerIds.map((playerId) => {
          const player = players.find(
            (candidate) => candidate.id === playerId
          );

          return {
            playerId,
            groupId: group.id,
            groupName: group.name.replace(
              'Group',
              'Card'
            ),
            playerName: player?.name ?? playerId
          };
        })
      );
  }, [groups, players, activeGroup]);

  function playerName(playerId: string): string {
    return (
      players.find(
        (player) => player.id === playerId
      )?.name ?? playerId
    );
  }

  function closePlayerActions() {
    setActivePlayerId(null);
    setActiveAction(null);
    setDestinationGroupId('');
    setSwapPlayerId('');
  }

  function openPlayerActions(playerId: string) {
    if (activePlayerId === playerId) {
      closePlayerActions();
      return;
    }

    setActivePlayerId(playerId);
    setActiveAction(null);
    setDestinationGroupId('');
    setSwapPlayerId('');
  }

  function openMove() {
    setActiveAction('move');
    setDestinationGroupId('');
    setSwapPlayerId('');
  }

  function openSwap() {
    setActiveAction('swap');
    setDestinationGroupId('');
    setSwapPlayerId('');
  }

  function confirmMove() {
    if (
      !activePlayerId ||
      !activeGroup ||
      !destinationGroupId
    ) {
      return;
    }

    onMovePlayer(
      activePlayerId,
      activeGroup.id,
      destinationGroupId
    );

    closePlayerActions();
  }

  function confirmSwap() {
    if (
      !activePlayerId ||
      !swapPlayerId
    ) {
      return;
    }

    onSwapPlayers(
      activePlayerId,
      swapPlayerId
    );

    closePlayerActions();
  }

  function makeScorekeeper() {
    if (
      !activePlayerId ||
      !activeGroup
    ) {
      return;
    }

    onChangeScorekeeper(
      activeGroup.id,
      activePlayerId
    );

    closePlayerActions();
  }

  return (
    <section className="card">
      <h2>Saturday Card Manager</h2>

      <p>
        Make final card changes before play begins. All
        changes become part of the official scorecards
        used for score entry.
      </p>

      <div className="score-grid">
        {groups.map((group) => {
          const scorekeeperId =
            group.scorekeeperIds[0];

          return (
            <section
              className="card"
              key={group.id}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}
              >
                <div>
                  <h3
                    style={{
                      marginTop: 0,
                      marginBottom: '0.25rem'
                    }}
                  >
                    {group.name.replace(
                      'Group',
                      'Card'
                    )}
                  </h3>

                  <div>
                    {group.playerIds.length}{' '}
                    {group.playerIds.length === 1
                      ? 'player'
                      : 'players'}
                  </div>
                </div>

                <div>
                  <strong>Scorekeeper:</strong>{' '}
                  {scorekeeperId
                    ? playerName(scorekeeperId)
                    : 'Not assigned'}
                </div>
              </div>

              <div
                style={{
                  marginTop: '1rem'
                }}
              >
                {group.playerIds.map((playerId) => {
                  const isScorekeeper =
                    scorekeeperId === playerId;

                  const actionsOpen =
                    activePlayerId === playerId;

                  return (
                    <div
                      key={playerId}
                      style={{
                        borderTop:
                          '1px solid rgba(0, 0, 0, 0.12)',
                        padding: '0.75rem 0'
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          alignItems: 'center',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div>
                          <strong>
                            {playerName(playerId)}
                          </strong>

                          {isScorekeeper && (
                            <span>
                              {' '}
                              — Scorekeeper
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            openPlayerActions(playerId)
                          }
                        >
                          {actionsOpen
                            ? 'Close Actions'
                            : 'Actions'}
                        </button>
                      </div>

                      {actionsOpen &&
                        activePlayer &&
                        activeGroup && (
                          <div
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.75rem',
                              border:
                                '1px solid rgba(0, 0, 0, 0.12)',
                              borderRadius: '0.5rem'
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                gap: '0.75rem',
                                flexWrap: 'wrap'
                              }}
                            >
                              <button
                                type="button"
                                onClick={openMove}
                              >
                                Move
                              </button>

                              <button
                                type="button"
                                onClick={openSwap}
                              >
                                Swap
                              </button>

                              <button
                                type="button"
                                disabled={isScorekeeper}
                                onClick={makeScorekeeper}
                              >
                                {isScorekeeper
                                  ? 'Current Scorekeeper'
                                  : 'Make Scorekeeper'}
                              </button>
                            </div>

                            {activeAction === 'move' && (
                              <div
                                style={{
                                  marginTop: '1rem'
                                }}
                              >
                                <label>
                                  <strong>
                                    Move {activePlayer.name} to
                                  </strong>

                                  <select
                                    value={
                                      destinationGroupId
                                    }
                                    onChange={(event) =>
                                      setDestinationGroupId(
                                        event.target.value
                                      )
                                    }
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      marginTop: '0.5rem',
                                      marginBottom: '0.75rem',
                                      padding: '0.75rem',
                                      fontSize: '1rem'
                                    }}
                                  >
                                    <option value="">
                                      Select destination card
                                    </option>

                                    {groups
                                      .filter(
                                        (
                                          destinationGroup
                                        ) =>
                                          destinationGroup.id !==
                                          activeGroup.id
                                      )
                                      .map(
                                        (
                                          destinationGroup
                                        ) => (
                                          <option
                                            key={
                                              destinationGroup.id
                                            }
                                            value={
                                              destinationGroup.id
                                            }
                                          >
                                            {destinationGroup.name.replace(
                                              'Group',
                                              'Card'
                                            )}{' '}
                                            —{' '}
                                            {
                                              destinationGroup
                                                .playerIds
                                                .length
                                            }{' '}
                                            players
                                          </option>
                                        )
                                      )}
                                  </select>
                                </label>

                                <button
                                  type="button"
                                  disabled={
                                    !destinationGroupId
                                  }
                                  onClick={confirmMove}
                                >
                                  Confirm Move
                                </button>
                              </div>
                            )}

                            {activeAction === 'swap' && (
                              <div
                                style={{
                                  marginTop: '1rem'
                                }}
                              >
                                <label>
                                  <strong>
                                    Swap {activePlayer.name} with
                                  </strong>

                                  <select
                                    value={swapPlayerId}
                                    onChange={(event) =>
                                      setSwapPlayerId(
                                        event.target.value
                                      )
                                    }
                                    style={{
                                      display: 'block',
                                      width: '100%',
                                      marginTop: '0.5rem',
                                      marginBottom: '0.75rem',
                                      padding: '0.75rem',
                                      fontSize: '1rem'
                                    }}
                                  >
                                    <option value="">
                                      Select another player
                                    </option>

                                    {swapOptions.map(
                                      (option) => (
                                        <option
                                          key={
                                            option.playerId
                                          }
                                          value={
                                            option.playerId
                                          }
                                        >
                                          {
                                            option.playerName
                                          }{' '}
                                          —{' '}
                                          {
                                            option.groupName
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>
                                </label>

                                <button
                                  type="button"
                                  disabled={!swapPlayerId}
                                  onClick={confirmSwap}
                                >
                                  Confirm Swap
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}