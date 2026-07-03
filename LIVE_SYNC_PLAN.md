# Live Sync Plan

Bear Tracker will support two modes:

1. Local Test Mode
   - Browser storage only.
   - Good for testing scoring rules, groups, payouts, and reports.

2. Live Saturday Mode
   - Supabase database.
   - Scores entered by scorekeepers sync to every phone.
   - Admin controls round setup, groups, score corrections, and finalization.

## Required Live Tables
- players
- courses
- course_holes
- rounds
- round_players
- groups
- group_members
- scores
- skins
- payouts
- quota_adjustments
- audit_log

## Realtime Events
The following should trigger app refreshes:
- score added or changed
- group assignment changed
- round status changed
- payout/finalization completed

## Saturday Morning Connection Check
Before using the app live:
1. Open admin dashboard.
2. Confirm Supabase connection is green.
3. Create test score on Hole 1.
4. Confirm it appears on another phone.
5. Delete/reset test score.
6. Begin round.
