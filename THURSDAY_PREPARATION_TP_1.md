# Thursday Preparation TP-1

Mission: Applying Thursday pairings creates a new repository tournament and makes it current.

## Changes

- Pairings Import asks for the Saturday tournament date.
- The date defaults to the next Saturday.
- Apply Pairings creates the scorecards and a new official repository tournament.
- The new tournament receives the standard date-based name and becomes current.
- A second tournament for the same date is rejected rather than created silently.
- The existing tournament remains unchanged if creation is rejected.

## Acceptance test

1. In Pairings Import, choose a date that is not already in the Tournament Library.
2. Paste and review the pairings.
3. Click Apply Pairings.
4. Confirm the current-tournament banner uses the selected date and the new tournament appears in the library.
5. Stop and restart Vite.
6. Confirm the new tournament remains current and its pairings/cards remain present.
7. Attempt to apply pairings again for the same date and confirm Bear Tracker refuses to create a duplicate.

Do not commit until steps 1-7 pass.
