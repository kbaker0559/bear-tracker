# Bear Tracker AT-34.2 — Duplicate Tournament

This focused update enables repository-backed tournament duplication.

Changed files:
- `src/storage/tournamentRepositoryCore.ts`
- `src/storage/tournamentRepositoryReadBridge.ts`
- `src/components/TournamentLibrary.tsx`
- `src/App.tsx`
- `scripts/test-tournament-repository.mjs`

The repository test verifies:
- a duplicate receives a new permanent ID;
- the duplicate records its source tournament ID;
- original and duplicate survive restart independently;
- editing the duplicate does not change the original.
