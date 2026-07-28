# Tournament Repository Core — Step 1

This build adds an isolated, storage-independent repository core. It does not
change the current Tournament Library UI or migration behavior.

## Implemented

- Create a tournament document with a permanent ID.
- Save tournament data without changing its ID, name, date, or creation time.
- Load a tournament by ID.
- List persisted tournament summaries.
- Inject the storage adapter, clock, and ID factory so behavior is testable.

## Automated verification

Run:

```powershell
npm.cmd run test:repository
```

The test constructs a repository, creates and persists a tournament, simulates
an application restart with a new repository instance, loads and lists the
same tournament, saves changed data, and verifies that identity metadata is
unchanged.

## Intentionally not included

- Current tournament pointer
- Rename
- Duplicate
- Delete
- Migration
- Tournament Library UI changes

Those belong to later repository steps after this core passes verification.
