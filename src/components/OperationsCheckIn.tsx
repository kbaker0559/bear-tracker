import {
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import type { Player } from '../types';
import { sortPlayersByLastName } from '../utils/playerSort';
import ArrivalPaymentForm from './ArrivalPaymentForm';

type ArrivalPayment = {
  cashPaid: number;
  creditApplied: number;
};

type Props = {
  players: Player[];
  expectedPlayerIds: string[];
  checkedInPlayerIds: string[];
  paidPlayerIds: string[];

  getAvailableCredit: (playerId: string) => number;

  onCompleteArrival: (
    playerId: string,
    payment: ArrivalPayment
  ) => void;
};

export default function OperationsCheckIn({
  players,
  expectedPlayerIds,
  checkedInPlayerIds,
  paidPlayerIds,
  getAvailableCredit,
  onCompleteArrival
}: Props) {
  const [searchText, setSearchText] = useState('');
  const [selectedPlayerId, setSelectedPlayerId] =
    useState<string | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    sectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 350);

    return () => window.clearTimeout(focusTimer);
  }, []);

  const waitingPlayers = useMemo(() => {
    const normalizedSearch = searchText.trim().toLowerCase();

    return sortPlayersByLastName(
      players.filter((player) => {
        const expected = expectedPlayerIds.includes(player.id);
        const complete =
          checkedInPlayerIds.includes(player.id) &&
          paidPlayerIds.includes(player.id);

        const matchesSearch =
          normalizedSearch.length === 0 ||
          player.name.toLowerCase().includes(normalizedSearch);

        return expected && !complete && matchesSearch;
      })
    );
  }, [
    players,
    expectedPlayerIds,
    checkedInPlayerIds,
    paidPlayerIds,
    searchText
  ]);

  const selectedPlayer =
    players.find((player) => player.id === selectedPlayerId) ??
    null;

  useEffect(() => {
    if (!selectedPlayerId) {
      return;
    }

    sectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }, [selectedPlayerId]);

  function completeArrival(
    playerId: string,
    payment: ArrivalPayment
  ) {
    onCompleteArrival(playerId, payment);
    setSelectedPlayerId(null);
    setSearchText('');

    window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  }

  function selectOnlyMatch() {
    if (waitingPlayers.length === 1) {
      setSelectedPlayerId(waitingPlayers[0].id);
    }
  }

  if (selectedPlayer) {
    return (
      <section ref={sectionRef}>
        <ArrivalPaymentForm
          player={selectedPlayer}
          entryFee={25}
          availableCredit={getAvailableCredit(
            selectedPlayer.id
          )}
          onComplete={(payment) =>
            completeArrival(selectedPlayer.id, payment)
          }
          onCancel={() => {
            setSelectedPlayerId(null);

            window.setTimeout(() => {
              searchInputRef.current?.focus();
            }, 0);
          }}
        />
      </section>
    );
  }

  return (
    <section className="card" ref={sectionRef}>
      <h2>Arrive Player and Collect Entry</h2>

      <p>
        <strong>{waitingPlayers.length}</strong> still waiting ·{' '}
        <strong>{checkedInPlayerIds.length}</strong> arrived ·{' '}
        <strong>{paidPlayerIds.length}</strong> entries satisfied
      </p>

      <label>
        <strong>Find Player</strong>

        <input
          ref={searchInputRef}
          type="search"
          value={searchText}
          onChange={(event) =>
            setSearchText(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              waitingPlayers.length === 1
            ) {
              event.preventDefault();
              selectOnlyMatch();
            }
          }}
          placeholder="Type a player’s name..."
          style={{
            display: 'block',
            width: '100%',
            marginTop: '0.5rem',
            marginBottom: '1rem',
            padding: '0.75rem',
            fontSize: '1rem'
          }}
        />
      </label>

      <h3>
        Still Waiting ({waitingPlayers.length})
      </h3>

      {waitingPlayers.length === 1 && searchText.trim() !== '' && (
        <p>
          Press <strong>Enter</strong> to select{' '}
          <strong>{waitingPlayers[0].name}</strong>.
        </p>
      )}

      <div className="score-grid">
        {waitingPlayers.map((player) => {
          const availableCredit =
            getAvailableCredit(player.id);

          return (
            <div className="score-row" key={player.id}>
              <div>
                <strong>{player.name}</strong>

                <div>
                  HDCP {player.handicap} · Quota{' '}
                  {player.quota}
                </div>

                <div>
                  Entry fee: <strong>$25</strong>
                </div>

                {availableCredit > 0 && (
                  <div>
                    League credit available:{' '}
                    <strong>${availableCredit}</strong>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedPlayerId(player.id)
                }
              >
                Complete Arrival
              </button>
            </div>
          );
        })}
      </div>

      {waitingPlayers.length === 0 && (
        <p>Everyone expected has completed arrival.</p>
      )}
    </section>
  );
}