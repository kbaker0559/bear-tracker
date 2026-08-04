# Validation Subsystem

## Responsibility

Verify imported and entered data before scoring.

## Owns

- Gross/Net validation
- Impossible score detection
- OCR confidence review
- Score consistency checks

## Does Not Own

- OCR recognition
- Player identities
- Stableford calculations

## Planned Public API

- `validateScorecard()`
- `validateHoleScore()`
- `validateNetScore()`
- `buildConfidenceReview()`