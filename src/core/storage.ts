import type { CacheEntry } from './types';

const STORAGE_KEY = 'kvale-cache';
const warnedPersistenceFailures = new Set<string>();

function warnStorageFailure(kind: 'persist' | 'hydrate', error: unknown): void {
  const message =
    error instanceof Error
      ? `${error.name}:${error.message}`
      : typeof error === 'string'
        ? error
        : String(error);
  const warningKey = `${kind}:${message}`;
  if (warnedPersistenceFailures.has(warningKey)) return;

  warnedPersistenceFailures.add(warningKey);
  if (kind === 'persist') {
    console.warn('[kvale] Failed to persist cache:', error);
  } else {
    console.warn('[kvale] Failed to hydrate cache:', error);
  }
}

/**
 * Persists the entire cache entry Map to storage under a single key.
 * Swallows quota/private-mode/storage exceptions and logs a warning once per runtime.
 *
 * @example
 * persistCache(localStorage, cacheEntries);
 */
export function persistCache(storage: Storage, entries: Map<string, CacheEntry>): void {
  try {
    const serialized = JSON.stringify(Object.fromEntries(entries));
    storage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    warnStorageFailure('persist', error);
    // Best-effort — quota exceeded, private mode, etc.
  }
}

/**
 * Reconstructs a Map of cache entries from the provided Storage.
 *
 * Parses the stored JSON value at the module's STORAGE_KEY and includes only entries whose value is a non-array object containing a numeric `timestamp` property, a `data` property, and—if present—an `error` property that is a string (otherwise the entry is rejected). Any missing, malformed, or unparsable storage content results in an empty Map.
 * Storage access and parse failures are swallowed and logged once per runtime.
 *
 * @returns A Map mapping cache keys to `CacheEntry` objects; returns an empty Map if storage is missing, empty, contains invalid JSON, or contains no valid entries.
 */
export function hydrateCache(storage: Storage): Map<string, CacheEntry> {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return new Map();

    const entries: [string, CacheEntry][] = [];
    for (const [key, value] of Object.entries(parsed)) {
      if (
        value &&
        typeof value === 'object' &&
        !Array.isArray(value) &&
        'timestamp' in value &&
        typeof value.timestamp === 'number' &&
        'data' in value
      ) {
        // Hydrate error: reconstruct Error from serialized plain object or set to null
        let error: Error | null = null;
        if ('error' in value && value.error !== null) {
          if (typeof value.error === 'string') {
            error = new Error(value.error);
          } else if (
            typeof value.error === 'object' &&
            !Array.isArray(value.error) &&
            'message' in value.error
          ) {
            error = new Error(String(value.error.message));
            if ('name' in value.error && typeof value.error.name === 'string') {
              error.name = value.error.name;
            }
          }
        }

        const entry: CacheEntry = {
          data: value.data,
          timestamp: value.timestamp,
          error,
        };
        entries.push([key, entry]);
      }
    }

    return new Map(entries);
  } catch (error) {
    warnStorageFailure('hydrate', error);
    return new Map();
  }
}
