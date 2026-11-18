// The only module that touches window.localStorage.
// Keys are "findit." + name, as in the old app. Every access is guarded:
// storage can be missing (server render), blocked (private mode) or full.

export const STORE_PREFIX = "findit.";

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

// The stored string, or null when missing or unreadable
export function readRaw(name: string): string | null {
  try {
    return storage()?.getItem(STORE_PREFIX + name) ?? null;
  } catch {
    return null;
  }
}

// Returns false, changing nothing, when storage is unavailable or full
export function writeRaw(name: string, value: string): boolean {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(STORE_PREFIX + name, value);
    return true;
  } catch {
    return false;
  }
}

// The parsed JSON value, or undefined when missing or not valid JSON
// (the old app's loadStore() then falls back to its default)
export function readJSON(name: string): unknown {
  const raw = readRaw(name);
  if (raw === null) return undefined;
  try {
    const parsed: unknown = JSON.parse(raw);
    return parsed;
  } catch {
    return undefined;
  }
}

export function writeJSON(name: string, value: unknown): boolean {
  return writeRaw(name, JSON.stringify(value));
}

// Calls back when another tab changes a findit.* key (or clears storage)
export function onExternalChange(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const listener = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(STORE_PREFIX)) callback();
  };
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}
