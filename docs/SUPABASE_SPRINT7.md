# Bear Tracker Sprint 7 — Supabase Foundation

This sprint adds the first real live-database foundation.

## What was added

- `supabase/schema.sql` — tables for players, course, rounds, groups, group players, and scores.
- `supabase/seed.sql` — Black Bear course and hole data.
- `src/services/supabaseRest.ts` — a small REST adapter for connection testing and player push.
- A new in-app **Live DB** tab for setup tracking.

## What this is not yet

This does not make scoring live across phones yet. It prepares the database and connection layer. The next live-sync sprint will write and read scores from Supabase.

## Setup summary

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Copy your Project URL and anon public key into the app's Live DB tab.
6. Test connection.
