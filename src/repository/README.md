# Repository Subsystem

## Responsibility

Store and retrieve Bear Tracker data reliably.

## Owns

- Tournament persistence
- League-player persistence
- Current-tournament pointers
- Autosave
- Backups and restoration
- Benchmarks
- Storage migrations

## Does Not Own

- Tournament rules or workflow
- Player identity matching
- OCR recognition
- Stableford or quota calculations
- User-interface decisions

## Planned Public API

- `saveTournament()`
- `loadTournament()`
- `listTournaments()`
- `saveLeaguePlayers()`
- `loadLeaguePlayers()`
- `exportBackup()`
- `restoreBackup()`