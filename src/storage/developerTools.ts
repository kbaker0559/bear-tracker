const RESET_PENDING_KEY =
  'bear-tracker-reset-pending';

const STORAGE_PREFIXES = [
  'bear-tracker:',
  'glos-'
];

function removeBearTrackerStorage(): number {
  const keysToRemove: string[] = [];

  for (
    let index = 0;
    index < window.localStorage.length;
    index += 1
  ) {
    const key = window.localStorage.key(index);

    if (
      key !== null &&
      STORAGE_PREFIXES.some((prefix) =>
        key.startsWith(prefix)
      )
    ) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    window.localStorage.removeItem(key);
  }

  return keysToRemove.length;
}

export function resetBearTrackerStorage(): void {
  window.sessionStorage.setItem(
    RESET_PENDING_KEY,
    'true'
  );

  window.location.reload();
}

export function completePendingBearTrackerReset(): void {
  const resetPending =
    window.sessionStorage.getItem(
      RESET_PENDING_KEY
    );

  if (resetPending !== 'true') {
    return;
  }

  removeBearTrackerStorage();

  window.sessionStorage.removeItem(
    RESET_PENDING_KEY
  );
}