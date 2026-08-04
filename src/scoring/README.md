# Scoring Subsystem

## Responsibility

Convert golf scores into competition results.

## Owns

- Hole scores
- Stableford
- Quotas
- Leaderboard
- Skins
- Places
- Payout calculations

## Does Not Own

- OCR
- Permanent player identities
- Tournament workflow

## Planned Public API

- `calculateStableford()`
- `calculateLeaderboard()`
- `calculateSkins()`
- `calculateQuotaChanges()`
- `calculatePlaces()`