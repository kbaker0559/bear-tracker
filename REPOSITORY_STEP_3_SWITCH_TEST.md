# Repository Step 3 switch-test fix

This focused update adds the missing visible test path for Repository Step 3.

## Changes

- Adds an **Open** button beside every non-current repository tournament.
- Creates one temporary **Repository Test B** entry when only one tournament exists.
- The temporary entry is read-only and points to the same underlying tournament data.
- Keeps the repository current pointer separate from the legacy document ID.
- Does not add rename, duplicate, archive, delete, migration, OCR, or write integration.

## Acceptance test

1. Open the entry without the Current badge.
2. Restart Vite.
3. Confirm that entry remains Current.
4. Open the other entry.
5. Restart Vite again.
6. Confirm the other entry remains Current.
