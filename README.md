# Bear Tracker Sprint 4 — Payouts & Finalization

This sprint adds the first real results workflow:

- Place payout preview
- 9–15 players pay 4 places; 16+ players pay 5 places
- Tie splitting with dollar amounts rounded down
- In-the-money rule for quota increases
- Quota decrease logic still applies outside the money
- Skins count summary
- Finalize Round button that updates quotas, archives the round, and clears current scores
- Unit tests for payout edge cases

## Run locally

```bash
npm install
npm test
npm run build
npm run dev
```

Default admin PIN: `1006`.

## Commit message

`Add payout finalization sprint 4`
