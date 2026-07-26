Bear Tracker Sprint 3.1 - Card and Player Identity Test

Copy the contents of this update into the root of the current bear-tracker project.
Merge folders and replace matching files.

Changed/new files:
- vite.config.ts
- src/App.tsx
- src/styles.css
- src/components/ScorecardPhotoPanel.tsx
- src/components/TournamentWorkspace.tsx
- src/components/PlayerRecognitionPanel.tsx
- src/services/aiScorecardService.ts
- src/services/playerNameMatching.ts
- src/types/aiScorecard.ts

Test:
1. Restart npm.cmd run dev.
2. Attach a real scorecard photo.
3. Click Identify Card & Players.
4. Verify card number, tee time, raw handwritten names, and assigned-player matches.
