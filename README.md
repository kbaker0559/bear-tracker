# Bear Tracker — Actual Sprint 2

This sprint builds on the real scoring foundation and adds:

- PIN login
- Admin/player session state
- Player administration
- Edit handicap, quota, PIN, and active status
- Add golfer
- Local browser persistence
- Leaderboard and skins tabs using the real scoring engines

## Test PINs

- Admin: `0559`
- Player PINs are seeded as 1000, 1001, 1002, etc. and are editable from Player Admin.

## Run locally

```bash
npm install
npm test
npm run dev
```

## Build

```bash
npm run build
```
