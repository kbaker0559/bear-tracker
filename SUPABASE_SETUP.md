# Supabase Setup for Bear Tracker

## 1. Create project
1. Go to Supabase.
2. Create a new project named `bear-tracker`.
3. Save your project URL and anon public key.

## 2. Create tables
Open Supabase SQL Editor and run `supabase_schema.sql`.

## 3. App data model
The first live version will use these tables:
- leagues
- courses
- holes
- players
- rounds
- round_players
- groups
- group_members
- scores
- payouts
- quota_history

## 4. Login approach
Bear Tracker will use simple player PINs for now:
- Admin PIN unlocks admin controls.
- Scorekeeper PIN allows scoring assigned group.
- Regular player PIN allows viewing and possibly own-score entry later.

## 5. Security note
PIN login is convenient for a private golf group, but it is not bank-level authentication. This is fine for league scoring and payouts, but we should avoid storing sensitive personal information.
