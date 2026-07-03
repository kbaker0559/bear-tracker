# Supabase Quickstart for Bear Tracker

## Goal
Turn Bear Tracker from a local browser app into a shared live scoring app so multiple phones can see the same round.

## Steps
1. Create a free Supabase project.
2. Open SQL Editor.
3. Run `supabase-schema.sql`.
4. Run `seed-black-bear.sql`.
5. Go to Project Settings → API.
6. Copy the Project URL and anon public key.
7. Create `config.js` from `config.example.js`.
8. Paste those two values into `config.js`.
9. Commit and push.
10. Test from two phones on the live GitHub Pages URL.

## Important
Do not paste the service-role secret key into GitHub. Bear Tracker only needs the public anon key for browser access.

## First live test
Use two phones:
- Phone 1: admin/scorekeeper
- Phone 2: player/leaderboard viewer

Enter one score from Phone 1 and confirm Phone 2 updates after refresh or live sync.
