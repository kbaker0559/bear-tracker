# OCR Subsystem

## Responsibility

Convert scorecard images into text.

## Owns

- Image preprocessing
- OCR providers
- Confidence values
- Text extraction

## Does Not Own

- Player identities
- Stableford
- Tournament workflow
- Score validation

## Planned Public API

- `readScorecardImage()`
- `recognizePlayerNames()`
- `recognizeScores()`