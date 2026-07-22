import { useMemo, useState } from 'react';
import type { Player } from '../types';
import type { Scorecard } from '../types/scorecard';
import type { ScorecardEntry } from '../types/scoreEntry';
import type { TournamentVisibilitySettings } from '../types/tournamentVisibility';
import {
  buildLeaderboard
} from '../engine/leaderboardEngine';
import FastScorecardEntry from './FastScorecardEntry';
import PrivateLeaderboard from './PrivateLeaderboard';
import ScorecardReview from './ScorecardReview';

type Props = {
  scorecards: Scorecard[];
  scorecardEntries: ScorecardEntry[];
  players: Player[];
  visibility: TournamentVisibilitySettings;

  onUpdateScore: (
    scorecardId: string,
    playerId: string,
    holeNumber: number,
    grossScore: number | null
  ) => void;

  onVerifyScorecard: (
    scorecardId: string
  ) => void;
};

type ActiveView =
  | {
      type: 'entry';
      scorecardId: string;
      playerIndex: number;
    }
  | {
      type: 'review';
      scorecardId: string;
    }
  | null;

export default function TournamentWorkspace({
  scorecards,
  scorecardEntries,
  players,
  visibility,
  onUpdateScore,
  onVerifyScorecard
}: Props) {
  const [activeView, setActiveView] =
    useState<ActiveView>(null);

  const [
    showAdministratorStandings,
    setShowAdministratorStandings
  ] = useState(false);

  const orderedScorecards = useMemo(
    () =>
      [...scorecards].sort(
        (first, second) =>
          first.cardNumber - second.cardNumber
      ),
    [scorecards]
  );

  const leaderboard = useMemo(
    () =>
      buildLeaderboard(
        scorecardEntries
      ),
    [scorecardEntries]
  );

  const activeScorecardId =
    activeView?.scorecardId ?? null;

  const activeScorecard =
    orderedScorecards.find(
      (scorecard) =>
        scorecard.id === activeScorecardId
    ) ?? null;

  const activeScorecardEntry =
    scorecardEntries.find(
      (entry) =>
        entry.scorecardId === activeScorecardId
    ) ?? null;

  const verifiedScorecards =
    scorecardEntries.filter(
      (entry) => entry.status === 'verified'
    ).length;

  const completeButUnverifiedScorecards =
    scorecardEntries.filter(
      (entry) => entry.status === 'complete'
    ).length;

  const inProgressScorecards =
    scorecardEntries.filter(
      (entry) => entry.status === 'in-progress'
    ).length;

  const waitingScorecards =
    orderedScorecards.length -
    verifiedScorecards -
    completeButUnverifiedScorecards -
    inProgressScorecards;

  function getEntry(
    scorecardId: string
  ): ScorecardEntry | null {
    return (
      scorecardEntries.find(
        (entry) =>
          entry.scorecardId === scorecardId
      ) ?? null
    );
  }

  function getStatusLabel(
    entry: ScorecardEntry | null
  ): string {
    if (!entry) {
      return 'Not Ready';
    }

    switch (entry.status) {
      case 'not-started':
        return 'Waiting';

      case 'in-progress':
        return 'In Progress';

      case 'complete':
        return 'Ready to Verify';

      case 'verified':
        return 'Verified';
    }
  }

  function getButtonLabel(
    entry: ScorecardEntry | null
  ): string {
    if (!entry) {
      return 'Unavailable';
    }

    switch (entry.status) {
      case 'not-started':
        return 'Enter Scorecard';

      case 'in-progress':
        return 'Continue Entry';

      case 'complete':
        return 'Review Scorecard';

      case 'verified':
        return 'View Scorecard';
    }
  }

  function openScorecard(
    scorecardId: string,
    entry: ScorecardEntry | null
  ) {
    if (!entry) {
      return;
    }

    if (
      entry.status === 'complete' ||
      entry.status === 'verified'
    ) {
      setActiveView({
        type: 'review',
        scorecardId
      });

      return;
    }

    const firstIncompletePlayerIndex =
      entry.players.findIndex(
        (playerEntry) =>
          playerEntry.scores.some(
            (score) =>
              score.grossScore === null
          )
      );

    setActiveView({
      type: 'entry',
      scorecardId,
      playerIndex:
        firstIncompletePlayerIndex >= 0
          ? firstIncompletePlayerIndex
          : 0
    });
  }

  if (
    activeView?.type === 'entry' &&
    activeScorecard &&
    activeScorecardEntry
  ) {
    return (
      <FastScorecardEntry
        scorecard={activeScorecard}
        scorecardEntry={activeScorecardEntry}
        players={players}
        initialPlayerIndex={
          activeView.playerIndex
        }
        onUpdateScore={(
          playerId,
          holeNumber,
          grossScore
        ) =>
          onUpdateScore(
            activeScorecard.id,
            playerId,
            holeNumber,
            grossScore
          )
        }
        onReview={() =>
          setActiveView({
            type: 'review',
            scorecardId:
              activeScorecard.id
          })
        }
        onClose={() =>
          setActiveView(null)
        }
      />
    );
  }

  if (
    activeView?.type === 'review' &&
    activeScorecard &&
    activeScorecardEntry
  ) {
    return (
      <ScorecardReview
        scorecard={activeScorecard}
        scorecardEntry={
          activeScorecardEntry
        }
        players={players}
        onEditPlayer={(playerIndex) =>
          setActiveView({
            type: 'entry',
            scorecardId:
              activeScorecard.id,
            playerIndex
          })
        }
        onVerify={() => {
  onVerifyScorecard(
    activeScorecard.id
  );

  setActiveView(null);
}}
        onClose={() =>
          setActiveView(null)
        }
      />
    );
  }

  return (
    <section className="card">
      <h2>Tournament Workspace</h2>

      <div className="score-grid">
        <div className="score-row">
          <strong>Round Status</strong>
          <span>Round in Progress</span>
        </div>

        <div className="score-row">
          <strong>Scorecards</strong>
          <span>{orderedScorecards.length}</span>
        </div>

        <div className="score-row">
          <strong>Verified</strong>
          <span>{verifiedScorecards}</span>
        </div>

        <div className="score-row">
          <strong>Ready to Verify</strong>
          <span>
            {completeButUnverifiedScorecards}
          </span>
        </div>

        <div className="score-row">
          <strong>In Progress</strong>
          <span>{inProgressScorecards}</span>
        </div>

        <div className="score-row">
          <strong>Waiting</strong>
          <span>
            {Math.max(waitingScorecards, 0)}
          </span>
        </div>

        <div className="score-row">
          <strong>Leaderboard</strong>

          <span>
            {visibility.liveLeaderboardEnabled
              ? 'Visible During Play'
              : 'Hidden During Play'}
          </span>
        </div>
      </div>

      {!visibility.liveLeaderboardEnabled && (
        <div className="status-box">
          Competitive standings are hidden during play under league rules.
          Tournament calculations may still be reviewed privately by an
          administrator.
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          marginTop: '1rem',
          marginBottom: '1.5rem'
        }}
      >
        <button
          type="button"
          onClick={() =>
            setShowAdministratorStandings(
              (current) => !current
            )
          }
        >
          {showAdministratorStandings
            ? 'Hide Administrator Standings'
            : 'Show Administrator Standings'}
        </button>
      </div>

      {showAdministratorStandings && (
        <PrivateLeaderboard
          leaderboard={leaderboard}
          players={players}
        />
      )}

      <h3>Scorecard Queue</h3>

      {orderedScorecards.length === 0 && (
        <div className="status-box">
          No official scorecards have been created for this round.
        </div>
      )}

      <div className="score-grid">
        {orderedScorecards.map(
          (scorecard) => {
            const entry =
              getEntry(scorecard.id);

            return (
              <section
                className="card"
                key={scorecard.id}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent:
                      'space-between',
                    alignItems:
                      'flex-start',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}
                >
                  <div>
                    <h3
                      style={{
                        marginTop: 0,
                        marginBottom:
                          '0.25rem'
                      }}
                    >
                      Card{' '}
                      {scorecard.cardNumber}
                    </h3>

                    <div>
                      <strong>Status:</strong>{' '}
                      {getStatusLabel(entry)}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!entry}
                    onClick={() =>
                      openScorecard(
                        scorecard.id,
                        entry
                      )
                    }
                  >
                    {getButtonLabel(entry)}
                  </button>
                </div>

                <ul>
                  {scorecard.players.map(
                    (scorecardPlayer) => {
                      const player =
                        players.find(
                          (candidate) =>
                            candidate.id ===
                            scorecardPlayer.playerId
                        );

                      const playerEntry =
                        entry?.players.find(
                          (candidate) =>
                            candidate.playerId ===
                            scorecardPlayer.playerId
                        );

                      return (
                        <li
                          key={
                            scorecardPlayer.playerId
                          }
                        >
                          {player?.name ??
                            scorecardPlayer.playerId}

                          {playerEntry
                            ?.grossTotal !==
                            null &&
                          playerEntry?.grossTotal !==
                            undefined
                            ? ` — ${playerEntry.grossTotal} gross`
                            : ''}

                          {playerEntry
                            ?.quotaResult !== null &&
                          playerEntry?.quotaResult !==
                            undefined
                            ? ` / ${
                                playerEntry.quotaResult > 0
                                  ? `+${playerEntry.quotaResult}`
                                  : playerEntry.quotaResult === 0
                                    ? 'E'
                                    : playerEntry.quotaResult
                              }`
                            : ''}
                        </li>
                      );
                    }
                  )}
                </ul>
              </section>
            );
          }
        )}
      </div>
    </section>
  );
}