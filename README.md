# Bear Tracker Sprint 2

This is the first practical React/TypeScript implementation branch for Bear Tracker.

## Included

- React + TypeScript + Vite foundation
- Black Bear course data
- Saturday player list with handicap/quota/PIN values
- PIN login
- Admin player editing
- Group scorekeeper scoring workflow
- Stableford, net score, quota +/-, and skins calculations
- Local browser storage
- Unit tests for key scoring rules

## Demo login

Admin: Kevin Baker  
PIN: `0559`

Other players use starter PINs beginning with `1000`, `1001`, etc.

## Local setup

Install Node.js LTS, then from this folder run:

```bash
npm install
npm run dev
```

Run tests:

```bash
npm test
```

Build for GitHub Pages:

```bash
npm run build
```

## Next sprint

- True drag-and-drop group assignment
- Add/delete groups in the UI
- Round setup screen
- Payout engine UI
