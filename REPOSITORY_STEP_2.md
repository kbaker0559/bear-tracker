# Tournament Repository Step 2 — Current Tournament Pointer

This focused update adds only the repository's current-tournament pointer.
It does not connect the repository to Bear Tracker's UI yet.

## Added methods

- `setCurrent(id)`
- `getCurrentId()`
- `getCurrent()`

The pointer is stored separately from tournament documents. A missing or stale
pointer returns `null`; the repository never creates or silently chooses a
replacement tournament.

## Test

Run from the Bear Tracker project root:

```powershell
npm.cmd run test:repository
```

Expected heading:

`PASS Tournament Repository Step 2`
