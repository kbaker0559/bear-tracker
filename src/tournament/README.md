# Tournament Subsystem

## Responsibility

Manage the lifecycle of a single golf tournament from pairings through archival.

## Owns

- Tournament creation
- Tournament players
- Check-in
- Payments
- Player status
- Pairings
- Scorecard assignments
- Tournament events

## Does Not Own

- Permanent player identities
- OCR
- Stableford scoring
- Quota calculations
- Treasury accounting

## Planned Public API

- `createTournament()`
- `loadTournament()`
- `startTournament()`
- `checkInPlayer()`
- `assignPlayerToCard()`
- `recordTournamentEvent()`