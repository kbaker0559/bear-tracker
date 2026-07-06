# Bear Tracker Sprint 6 — Real Live Scoring Foundation

This sprint adds the first real live-scoring workflow using local browser state:

- PIN login remains assumed by player identity selection for local testing.
- Group score entry by hole.
- Gross, net, Stableford, quota +/- calculations.
- Leaderboard sorted by quota +/-.
- Net skins by hole, lowest unique net score wins.
- Round finalization preview helpers remain in the engine layer.
- Engine test harness included in `tests/engine.test.mjs`.

## Run locally

Install Node.js LTS, then from this folder:

```bash
npm install
npm run test:engine
npm run dev
```

## Commit message

```text
Add live scoring workflow sprint 6
```

## Notes

This is still local-browser mode. The next major engineering step is Supabase persistence and real-time sync so multiple phones see the same scores.
