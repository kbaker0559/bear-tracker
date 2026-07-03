# Bear Tracker Saturday Test Plan

Use this before inviting the whole group.

## 1. Admin setup
- Open Bear Tracker from the GitHub Pages URL.
- Confirm the app loads on desktop and iPhone.
- Confirm the PWA opens from Home Screen if installed.
- Confirm the player list includes all regular players.
- Confirm Black Bear par and hole handicap data are correct.

## 2. Round setup
- Create a test round named `Saturday Test`.
- Select 8-12 players for the first test.
- Create two or three groups.
- Assign one scorekeeper per group.

## 3. Score entry test
For each group:
- Enter scores for holes 1-3.
- Confirm gross score saves.
- Confirm net score calculates.
- Confirm Stableford points calculate.
- Confirm quota +/- updates.
- Confirm leaderboard order is correct.

## 4. Skins test
- Create at least one hole with a clear lowest unique net score.
- Create at least one hole where two players tie for low net.
- Confirm tied holes show no skin.

## 5. Payout and quota test
- Enter full 18-hole test scores for 9+ players.
- Confirm 4 places for 9-15 players.
- Confirm 5 places for 16+ players.
- Confirm tied place money is split and rounded down.
- Confirm only players in the money can move quota up.
- Confirm players below quota move down by the quota rules.

## 6. Backup test
- Export a backup.
- Restore the backup.
- Confirm scores, players, quotas, groups, skins, and money list remain intact.
