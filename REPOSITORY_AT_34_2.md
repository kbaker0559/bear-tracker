# AT-34.2 — Duplicate Tournament

This build enables repository-backed tournament duplication only.

Acceptance test:
1. Duplicate the current tournament using the suggested name.
2. Confirm both original and duplicate appear.
3. Open the duplicate and restart Vite; the duplicate remains current.
4. Open the original and restart Vite; the original remains current.
5. Rename the duplicate and confirm the original name is unchanged.
