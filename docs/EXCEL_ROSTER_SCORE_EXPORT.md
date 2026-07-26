# Excel Roster Score Export

After every scorecard is verified, Results displays **Copy All League Data for Excel**.

The clipboard contains no header row and exactly 24 tab-separated columns per league-roster player:

1. Numerical play order
2. First name
3. Last name
4. Played indicator (`1` for a participating golfer)
5. Course handicap used for the round
6. Quota points needed before the round
7–24. Gross scores for Holes 1–18

Played golfers appear first, ordered from the first golfer on Card 1 through the last golfer on the final card. Everyone else in the roster appears afterward with play order, played indicator, and scores blank; their roster handicap and quota remain populated.

Paste into Column A. The export ends at Column X. Columns Y and beyond are never included, protecting formulas to the right of the paste area.
