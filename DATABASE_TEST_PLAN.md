# Bear Tracker v1.7 Database Test Plan

1. Create Supabase project.
2. Run `DATABASE_SCHEMA.sql` in SQL Editor.
3. Run `SEED_DATA.sql` in SQL Editor.
4. Confirm these tables exist: leagues, players, courses, holes, rounds, round_players, scores, payouts, audit_log.
5. Confirm Black Bear has 18 holes.
6. Confirm Kevin Baker is admin with PIN 1234.
7. Confirm 24 active players are loaded.
8. Create one test round manually or through the app once live wiring is enabled.
9. Enter a few test scores and verify duplicate scores per player/hole are blocked by the unique constraint.
10. Export a backup after setup.
