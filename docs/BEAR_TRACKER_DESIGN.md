# Bear Tracker Design Decisions

## Purpose

Bear Tracker is the Black Bear Saturday golf league configuration of GLOS, the Golf League Operating System.

The application is designed around the league’s actual Saturday workflow:

1. Prepare weekly pairings.
2. Handle arrivals, payments, no-shows, and last-minute card changes.
3. Start the round with the final official pairings.
4. Enter each paper scorecard as it arrives.
5. Verify gross totals and Stableford points.
6. Calculate standings, skins, places, payouts, and quota changes.
7. Preserve the completed round and its correction history.

---

## Core Design Principle

The application must reduce the time and mental effort required to operate the Saturday game.

Bear Tracker should adapt to the league’s existing workflow rather than force the league to adopt a generic golf-software workflow.

---

# Players and Weekly Round Data

## Player Profile

A player profile may contain current values such as:

- Name
- Current handicap
- Current quota
- Active or inactive status
- Account credit balance

These values can change over time.

## Round-Specific Snapshots

The following values must be copied into the weekly round when pairings are created:

- Handicap for that round
- Quota, or Points Needed, for that round
- Tee assignment
- Card assignment
- Scorekeeper assignment

Historical rounds must retain their original handicap and quota values even after the player’s current profile changes.

A player’s quota may:

- Stay the same
- Increase
- Decrease

The quota shown as **Points Needed** on a paper card is the official quota for that particular round.

---

# Player Participation Status

Bear Tracker must distinguish between different reasons a player does not compete.

Recommended round-player statuses include:

- Expected
- Checked In
- Playing
- No Show
- DNS — Did Not Start
- Withdrawn
- Completed

## DNS — Did Not Start

DNS is used when a player was expected and may have arrived at the course but did not begin play.

Example:

- Cam Crollard arrived on July 4, 2026.
- He experienced vertigo and could not play.
- He should be recorded as DNS, not as a no-show.

A DNS player:

- Remains in the round’s attendance history
- Does not receive a scorecard entry
- Is excluded from leaderboard calculations
- Is excluded from places
- Is excluded from skins and other contests
- Does not receive a quota adjustment
- May retain payment information if applicable
- May have an optional reason recorded

---

# Pairings and Scorecards

## Official Pairings

The official scorecards used for scoring must reflect the final Saturday morning assignments.

Last-minute changes may include:

- Removing a player
- Moving a player to another card
- Swapping two players
- Changing the scorekeeper
- Marking a player DNS
- Adding a walk-on

Any pairing change made before play must also update:

- Score entry
- Scorecard membership
- Scorekeeper assignment
- Tournament processing
- Round history

---

# Score Entry Workflow

Scorecards arrive independently, generally about every 15 minutes.

The intended entry order is:

1. Enter all 18 gross scores for Player 1.
2. Review that player’s front, back, total, points, quota, and plus/minus.
3. Continue to Player 2.
4. Repeat for every player on the card.
5. Review the entire scorecard.
6. Verify the scorecard.

The interface should not require all scorecards to be present before scoring begins.

## Fast Entry

Normal score entry supports single-digit gross scores from 1 through 9.

After a valid score is typed:

- The score is saved.
- The cursor automatically advances to the next hole.
- Hole 18 does not automatically move to the next player.
- The current player’s confirmation panel appears for review.

Exceptional scores of 10 or more may be handled through a future exceptional-score workflow.

---

# Course Data

Bear Tracker currently uses Black Bear Golf Club.

Each hole stores:

- Hole number
- Par
- Stroke index

Black Bear hole data:

| Hole | Par | Stroke Index |
|---:|---:|---:|
| 1 | 4 | 5 |
| 2 | 5 | 17 |
| 3 | 3 | 15 |
| 4 | 5 | 11 |
| 5 | 3 | 9 |
| 6 | 4 | 1 |
| 7 | 4 | 7 |
| 8 | 4 | 13 |
| 9 | 4 | 3 |
| 10 | 4 | 10 |
| 11 | 3 | 12 |
| 12 | 4 | 2 |
| 13 | 4 | 6 |
| 14 | 5 | 14 |
| 15 | 3 | 18 |
| 16 | 5 | 16 |
| 17 | 4 | 4 |
| 18 | 4 | 8 |

---

# Stableford Scoring

Stableford points are calculated strictly from the player’s **gross score**.

| Gross Result | Points |
|---|---:|
| Double bogey or worse | 0 |
| Bogey | 1 |
| Par | 2 |
| Birdie | 4 |
| Eagle | 6 |
| Double eagle | 8 |

Stableford points are not calculated from net scores.

The application calculates:

- Front-nine gross
- Back-nine gross
- Total gross
- Front-nine Stableford points
- Back-nine Stableford points
- Total Stableford points
- Quota result

Quota result:

```text
Total Stableford Points − Round Quota