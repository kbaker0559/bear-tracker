import type { Group } from '../types';
import type { RoundBundle } from './roundEngine';
import { deriveScoreEntryStatus } from './scoreEntryEngine';

export type RoundManagementState = {
  groups: Group[];
  roundBundle: RoundBundle;
};

function findGroupForPlayer(
  groups: Group[],
  playerId: string
): Group | undefined {
  return groups.find((group) =>
    group.playerIds.includes(playerId)
  );
}

export function getCardAlignmentIssues(
  state: RoundManagementState
): string[] {
  const issues: string[] = [];

  for (const group of state.groups) {
    const scorecard = state.roundBundle.scorecards.find(
      (card) => card.id === group.id
    );
    const entry = state.roundBundle.scorecardEntries.find(
      (candidate) => candidate.scorecardId === group.id
    );

    if (!scorecard) {
      issues.push(`${group.name}: official scorecard missing`);
      continue;
    }

    if (!entry) {
      issues.push(`${group.name}: score-entry record missing`);
      continue;
    }

    const groupIds = group.playerIds.join('|');
    const scorecardIds = scorecard.players
      .map((player) => player.playerId)
      .join('|');
    const entryIds = entry.players
      .map((player) => player.playerId)
      .join('|');

    if (groupIds !== scorecardIds) {
      issues.push(`${group.name}: group and scorecard players differ`);
    }

    if (groupIds !== entryIds) {
      issues.push(`${group.name}: group and score-entry players differ`);
    }
  }

  return issues;
}

function verifyCardAlignment(
  state: RoundManagementState
): RoundManagementState {
  const issues = getCardAlignmentIssues(state);

  if (issues.length > 0) {
    throw new Error(
      `Card assignments did not stay synchronized: ${issues.join('; ')}`
    );
  }

  return state;
}

export function movePlayerBetweenCards(
  state: RoundManagementState,
  playerId: string,
  fromGroupId: string,
  toGroupId: string
): RoundManagementState {
  if (fromGroupId === toGroupId) {
    return state;
  }

  const sourceGroup = state.groups.find(
    (group) => group.id === fromGroupId
  );

  const destinationGroup = state.groups.find(
    (group) => group.id === toGroupId
  );

  if (!sourceGroup || !destinationGroup) {
    throw new Error(
      'The source or destination card could not be found.'
    );
  }

  if (!sourceGroup.playerIds.includes(playerId)) {
    throw new Error(
      'The selected player is not assigned to the source card.'
    );
  }

  if (destinationGroup.playerIds.includes(playerId)) {
    throw new Error(
      'The selected player is already assigned to the destination card.'
    );
  }

  const sourceScorecard =
    state.roundBundle.scorecards.find(
      (card) => card.id === fromGroupId
    );

  const destinationScorecard =
    state.roundBundle.scorecards.find(
      (card) => card.id === toGroupId
    );

  if (!sourceScorecard || !destinationScorecard) {
    throw new Error(
      'The official source or destination scorecard could not be found.'
    );
  }

  const movedScorecardPlayer =
    sourceScorecard.players.find(
      (player) => player.playerId === playerId
    );

  if (!movedScorecardPlayer) {
    throw new Error(
      'The player could not be found on the official source scorecard.'
    );
  }

  const sourceEntry =
    state.roundBundle.scorecardEntries.find(
      (entry) => entry.scorecardId === fromGroupId
    );

  const destinationEntry =
    state.roundBundle.scorecardEntries.find(
      (entry) => entry.scorecardId === toGroupId
    );

  if (!sourceEntry || !destinationEntry) {
    throw new Error(
      'The score-entry record for the source or destination card could not be found.'
    );
  }

  const movedPlayerEntry = sourceEntry.players.find(
    (player) => player.playerId === playerId
  );

  if (!movedPlayerEntry) {
    throw new Error(
      'The player could not be found in the source score-entry record.'
    );
  }

  const groups = state.groups.map((group) => {
    if (group.id === fromGroupId) {
      return {
        ...group,
        playerIds: group.playerIds.filter(
          (id) => id !== playerId
        ),
        scorekeeperIds: group.scorekeeperIds.filter(
          (id) => id !== playerId
        )
      };
    }

    if (group.id === toGroupId) {
      return {
        ...group,
        playerIds: [...group.playerIds, playerId]
      };
    }

    return group;
  });

  const scorecards =
    state.roundBundle.scorecards.map((card) => {
      if (card.id === fromGroupId) {
        return {
          ...card,
          players: card.players.filter(
            (player) => player.playerId !== playerId
          ),
          scorekeeperId:
            card.scorekeeperId === playerId
              ? undefined
              : card.scorekeeperId
        };
      }

      if (card.id === toGroupId) {
        return {
          ...card,
          players: [
            ...card.players,
            movedScorecardPlayer
          ]
        };
      }

      return card;
    });

  const roundPlayers =
    state.roundBundle.roundPlayers.map(
      (roundPlayer) =>
        roundPlayer.playerId === playerId
          ? {
              ...roundPlayer,
              scorecardId: toGroupId,
              scorekeeperForScorecardId:
                roundPlayer.scorekeeperForScorecardId ===
                fromGroupId
                  ? undefined
                  : roundPlayer.scorekeeperForScorecardId
            }
          : roundPlayer
    );

  const sourceImport =
    state.roundBundle.scorecardImports.find(
      (scorecardImport) =>
        scorecardImport.scorecardId === fromGroupId
    );

  const movedCells =
    sourceImport?.cells.filter(
      (cell) => cell.playerId === playerId
    ) ?? [];

  const movedIssues =
    sourceImport?.issues.filter(
      (issue) => issue.playerId === playerId
    ) ?? [];

  const scorecardImports =
    state.roundBundle.scorecardImports.map(
      (scorecardImport) => {
        if (
          scorecardImport.scorecardId === fromGroupId
        ) {
          return {
            ...scorecardImport,
            cells: scorecardImport.cells.filter(
              (cell) => cell.playerId !== playerId
            ),
            issues: scorecardImport.issues.filter(
              (issue) => issue.playerId !== playerId
            )
          };
        }

        if (
          scorecardImport.scorecardId === toGroupId
        ) {
          return {
            ...scorecardImport,
            cells: [
              ...scorecardImport.cells,
              ...movedCells
            ],
            issues: [
              ...scorecardImport.issues,
              ...movedIssues
            ]
          };
        }

        return scorecardImport;
      }
    );

  const scorecardEntries =
    state.roundBundle.scorecardEntries.map((entry) => {
      if (entry.scorecardId === fromGroupId) {
        const nextPlayers = entry.players.filter(
          (player) => player.playerId !== playerId
        );

        return {
          ...entry,
          players: nextPlayers,
          paperTotals: (entry.paperTotals ?? []).filter(
            (paper) => paper.playerId !== playerId
          ),
          status: deriveScoreEntryStatus(nextPlayers)
        };
      }

      if (entry.scorecardId === toGroupId) {
        const nextPlayers = [
          ...entry.players.filter(
            (player) => player.playerId !== playerId
          ),
          movedPlayerEntry
        ];
        const movedPaperTotal = (sourceEntry.paperTotals ?? []).find(
          (paper) => paper.playerId === playerId
        );

        return {
          ...entry,
          players: nextPlayers,
          paperTotals: [
            ...(entry.paperTotals ?? []).filter(
              (paper) => paper.playerId !== playerId
            ),
            ...(movedPaperTotal ? [movedPaperTotal] : [])
          ],
          status: deriveScoreEntryStatus(nextPlayers)
        };
      }

      return entry;
    });

  return verifyCardAlignment({
    groups,
    roundBundle: {
      ...state.roundBundle,
      roundPlayers,
      scorecards,
      scorecardImports,
      scorecardEntries
    }
  });
}

export function swapPlayersBetweenCards(
  state: RoundManagementState,
  firstPlayerId: string,
  secondPlayerId: string
): RoundManagementState {
  if (firstPlayerId === secondPlayerId) {
    throw new Error(
      'Select two different players to swap.'
    );
  }

  const firstGroup = findGroupForPlayer(
    state.groups,
    firstPlayerId
  );

  const secondGroup = findGroupForPlayer(
    state.groups,
    secondPlayerId
  );

  if (!firstGroup || !secondGroup) {
    throw new Error(
      'One or both players could not be found on the current cards.'
    );
  }

  if (firstGroup.id === secondGroup.id) {
    throw new Error(
      'The selected players are already on the same card.'
    );
  }

  const firstScorecard =
    state.roundBundle.scorecards.find(
      (card) => card.id === firstGroup.id
    );

  const secondScorecard =
    state.roundBundle.scorecards.find(
      (card) => card.id === secondGroup.id
    );

  if (!firstScorecard || !secondScorecard) {
    throw new Error(
      'One or both official scorecards could not be found.'
    );
  }

  const firstScorecardPlayer =
    firstScorecard.players.find(
      (player) => player.playerId === firstPlayerId
    );

  const secondScorecardPlayer =
    secondScorecard.players.find(
      (player) => player.playerId === secondPlayerId
    );

  if (!firstScorecardPlayer || !secondScorecardPlayer) {
    throw new Error(
      'One or both players could not be found on their official scorecards.'
    );
  }

  const firstEntry =
    state.roundBundle.scorecardEntries.find(
      (entry) => entry.scorecardId === firstGroup.id
    );

  const secondEntry =
    state.roundBundle.scorecardEntries.find(
      (entry) => entry.scorecardId === secondGroup.id
    );

  const firstPlayerEntry = firstEntry?.players.find(
    (player) => player.playerId === firstPlayerId
  );

  const secondPlayerEntry = secondEntry?.players.find(
    (player) => player.playerId === secondPlayerId
  );

  if (
    !firstEntry ||
    !secondEntry ||
    !firstPlayerEntry ||
    !secondPlayerEntry
  ) {
    throw new Error(
      'One or both players could not be found in the official score-entry records.'
    );
  }

  const groups = state.groups.map((group) => {
    if (group.id === firstGroup.id) {
      return {
        ...group,
        playerIds: group.playerIds.map((id) =>
          id === firstPlayerId ? secondPlayerId : id
        ),
        scorekeeperIds: group.scorekeeperIds.filter(
          (id) => id !== firstPlayerId
        )
      };
    }

    if (group.id === secondGroup.id) {
      return {
        ...group,
        playerIds: group.playerIds.map((id) =>
          id === secondPlayerId ? firstPlayerId : id
        ),
        scorekeeperIds: group.scorekeeperIds.filter(
          (id) => id !== secondPlayerId
        )
      };
    }

    return group;
  });

  const scorecards =
    state.roundBundle.scorecards.map((card) => {
      if (card.id === firstGroup.id) {
        return {
          ...card,
          players: card.players.map((player) =>
            player.playerId === firstPlayerId
              ? secondScorecardPlayer
              : player
          ),
          scorekeeperId:
            card.scorekeeperId === firstPlayerId
              ? undefined
              : card.scorekeeperId
        };
      }

      if (card.id === secondGroup.id) {
        return {
          ...card,
          players: card.players.map((player) =>
            player.playerId === secondPlayerId
              ? firstScorecardPlayer
              : player
          ),
          scorekeeperId:
            card.scorekeeperId === secondPlayerId
              ? undefined
              : card.scorekeeperId
        };
      }

      return card;
    });

  const roundPlayers =
    state.roundBundle.roundPlayers.map(
      (roundPlayer) => {
        if (roundPlayer.playerId === firstPlayerId) {
          return {
            ...roundPlayer,
            scorecardId: secondGroup.id,
            scorekeeperForScorecardId:
              roundPlayer.scorekeeperForScorecardId ===
              firstGroup.id
                ? undefined
                : roundPlayer.scorekeeperForScorecardId
          };
        }

        if (roundPlayer.playerId === secondPlayerId) {
          return {
            ...roundPlayer,
            scorecardId: firstGroup.id,
            scorekeeperForScorecardId:
              roundPlayer.scorekeeperForScorecardId ===
              secondGroup.id
                ? undefined
                : roundPlayer.scorekeeperForScorecardId
          };
        }

        return roundPlayer;
      }
    );

  const firstImport =
    state.roundBundle.scorecardImports.find(
      (scorecardImport) =>
        scorecardImport.scorecardId === firstGroup.id
    );

  const secondImport =
    state.roundBundle.scorecardImports.find(
      (scorecardImport) =>
        scorecardImport.scorecardId === secondGroup.id
    );

  const firstCells =
    firstImport?.cells.filter(
      (cell) => cell.playerId === firstPlayerId
    ) ?? [];

  const secondCells =
    secondImport?.cells.filter(
      (cell) => cell.playerId === secondPlayerId
    ) ?? [];

  const firstIssues =
    firstImport?.issues.filter(
      (issue) => issue.playerId === firstPlayerId
    ) ?? [];

  const secondIssues =
    secondImport?.issues.filter(
      (issue) => issue.playerId === secondPlayerId
    ) ?? [];

  const scorecardImports =
    state.roundBundle.scorecardImports.map(
      (scorecardImport) => {
        if (
          scorecardImport.scorecardId === firstGroup.id
        ) {
          return {
            ...scorecardImport,
            cells: [
              ...scorecardImport.cells.filter(
                (cell) =>
                  cell.playerId !== firstPlayerId
              ),
              ...secondCells
            ],
            issues: [
              ...scorecardImport.issues.filter(
                (issue) =>
                  issue.playerId !== firstPlayerId
              ),
              ...secondIssues
            ]
          };
        }

        if (
          scorecardImport.scorecardId === secondGroup.id
        ) {
          return {
            ...scorecardImport,
            cells: [
              ...scorecardImport.cells.filter(
                (cell) =>
                  cell.playerId !== secondPlayerId
              ),
              ...firstCells
            ],
            issues: [
              ...scorecardImport.issues.filter(
                (issue) =>
                  issue.playerId !== secondPlayerId
              ),
              ...firstIssues
            ]
          };
        }

        return scorecardImport;
      }
    );

  const firstPaperTotal = (firstEntry.paperTotals ?? []).find(
    (paper) => paper.playerId === firstPlayerId
  );
  const secondPaperTotal = (secondEntry.paperTotals ?? []).find(
    (paper) => paper.playerId === secondPlayerId
  );

  const scorecardEntries =
    state.roundBundle.scorecardEntries.map((entry) => {
      if (entry.scorecardId === firstGroup.id) {
        const nextPlayers = entry.players.map((player) =>
          player.playerId === firstPlayerId
            ? secondPlayerEntry
            : player
        );
        const nextPaperTotals = [
          ...(entry.paperTotals ?? []).filter(
            (paper) => paper.playerId !== firstPlayerId
          ),
          ...(secondPaperTotal ? [secondPaperTotal] : [])
        ];

        return {
          ...entry,
          players: nextPlayers,
          paperTotals: nextPaperTotals,
          status: deriveScoreEntryStatus(nextPlayers)
        };
      }

      if (entry.scorecardId === secondGroup.id) {
        const nextPlayers = entry.players.map((player) =>
          player.playerId === secondPlayerId
            ? firstPlayerEntry
            : player
        );
        const nextPaperTotals = [
          ...(entry.paperTotals ?? []).filter(
            (paper) => paper.playerId !== secondPlayerId
          ),
          ...(firstPaperTotal ? [firstPaperTotal] : [])
        ];

        return {
          ...entry,
          players: nextPlayers,
          paperTotals: nextPaperTotals,
          status: deriveScoreEntryStatus(nextPlayers)
        };
      }

      return entry;
    });

  return verifyCardAlignment({
    groups,
    roundBundle: {
      ...state.roundBundle,
      roundPlayers,
      scorecards,
      scorecardImports,
      scorecardEntries
    }
  });
}

export function changeCardScorekeeper(
  state: RoundManagementState,
  groupId: string,
  playerId: string
): RoundManagementState {
  const group = state.groups.find(
    (candidate) => candidate.id === groupId
  );

  if (!group) {
    throw new Error(
      'The selected card could not be found.'
    );
  }

  if (!group.playerIds.includes(playerId)) {
    throw new Error(
      'The scorekeeper must be assigned to the selected card.'
    );
  }

  const scorecard =
    state.roundBundle.scorecards.find(
      (candidate) => candidate.id === groupId
    );

  if (!scorecard) {
    throw new Error(
      'The official scorecard could not be found.'
    );
  }

  const groups = state.groups.map((candidate) =>
    candidate.id === groupId
      ? {
          ...candidate,
          scorekeeperIds: [playerId]
        }
      : candidate
  );

  const scorecards =
    state.roundBundle.scorecards.map((candidate) =>
      candidate.id === groupId
        ? {
            ...candidate,
            scorekeeperId: playerId
          }
        : candidate
    );

  const roundPlayers =
    state.roundBundle.roundPlayers.map(
      (roundPlayer) => {
        if (roundPlayer.scorecardId !== groupId) {
          return roundPlayer;
        }

        return {
          ...roundPlayer,
          scorekeeperForScorecardId:
            roundPlayer.playerId === playerId
              ? groupId
              : undefined
        };
      }
    );

  return {
    groups,
    roundBundle: {
      ...state.roundBundle,
      scorecards,
      roundPlayers
    }
  };
}