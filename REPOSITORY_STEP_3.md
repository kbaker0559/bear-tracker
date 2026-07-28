# Repository Step 3 — UI Read Integration

This build connects the visible Tournament Library to the verified repository for:

- tournament list metadata
- current-tournament pointer
- opening a tournament
- restoring the selected tournament after restart

The existing tournament documents and autosave path remain unchanged in this step.
Rename, duplicate, archive, and delete are intentionally hidden until write integration is tested.

## Manual acceptance test

1. Start Bear Tracker and open Administration → Tournament Library.
2. Confirm the panel says “Repository Step 3”.
3. Open Tournament A.
4. Stop and restart Vite.
5. Confirm Tournament A remains current.
6. Open Tournament B.
7. Stop and restart Vite.
8. Confirm Tournament B remains current.
