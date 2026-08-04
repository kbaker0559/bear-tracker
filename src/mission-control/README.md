# Mission Control Subsystem

## Responsibility

Interpret the current state of Bear Tracker and guide the user to the next appropriate action.

## Owns

- Workflow stage detection
- Readiness summaries
- Progress indicators
- Outstanding-action lists
- Next recommended action
- Attention and confidence-review summaries

## Does Not Own

- Tournament data
- Player identities
- OCR recognition
- Score calculations
- Persistent storage

## Planned Public API

- `buildMissionControlState()`
- `determineTournamentStage()`
- `getNextRecommendedAction()`
- `buildAttentionSummary()`
- `buildReadinessSummary()`