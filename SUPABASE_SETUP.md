# Supabase Setup for Bear Tracker

## 1. Create Project
Create a new Supabase project named `bear-tracker`.

## 2. Run Schema
Open Supabase SQL Editor and run `supabase/schema.sql`.

## 3. Run Seed Data
Run `supabase/seed.sql` after the schema succeeds.

## 4. Copy API Values
From Supabase Project Settings → API, copy:

- Project URL
- Anon public key

Add them to your app config.

## 5. Live Mode Tables
Core tables:

- players
- courses
- holes
- rounds
- round_players
- groups
- group_players
- scores
- correction_log
- round_results

## 6. First Live Test
Use two phones or one phone plus PC:

1. Open same round on both devices.
2. Enter one score on Device A.
3. Confirm Device B updates.
4. Correct a score as admin.
5. Confirm correction appears in log.
