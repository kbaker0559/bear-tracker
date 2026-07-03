# Bear Tracker Supabase Connection Guide v1.9

1. Create a Supabase project.
2. Open SQL Editor.
3. Run `DATABASE_SCHEMA.sql`.
4. Run `SEED_DATA.sql`.
5. Copy Project URL and public anon key from Project Settings > API.
6. Copy `src/config.example.js` to `src/config.js`.
7. Paste the URL and anon key.
8. Set `liveModeEnabled` to `true` only after testing.
9. Commit and push.
10. Open the app and verify the database status panel shows connected.

Never use the service_role key in the public app.
