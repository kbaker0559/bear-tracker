# Bear Tracker Sprint 7 — Supabase Foundation

This sprint adds the first live-database foundation while keeping the local scoring app intact.

## Added

- Supabase schema for players, courses, rounds, groups, group players, and scores
- Black Bear course seed SQL
- Live DB tab in the app
- Supabase REST connection test
- Push local players to Supabase
- Setup notes in `docs/SUPABASE_SPRINT7.md`

## Still local in this sprint

Score entry, leaderboard, and skins still use browser storage. The next sprint should move scores into Supabase for true multi-phone live scoring.

## Commands

```bash
npm install
npm run dev
npm run test:engine
npm run build
```
