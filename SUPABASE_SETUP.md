# Supabase Setup - Bear Tracker v1.1

1. Create a Supabase project named `bear-tracker`.
2. Open SQL Editor.
3. Run `supabase/schema.sql`.
4. Run `supabase/seed.sql`.
5. Go to Project Settings → API.
6. Copy the Project URL and anon/public key.
7. In Bear Tracker, open **Live Database** and paste both values.
8. Click **Test Connection**.
9. Click **Push Local Players** or **Load Players**.

This is the first live sync step. It syncs player/admin data only. Scores and rounds remain local until the next milestone.
