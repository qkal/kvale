import type { CacheEntry } from './types';

const STORAGE_KEY = 'kvale-cache';

/**
 * Persists the entire cache entry Map to storage under a single key.
 * Silently fails on quota errors, private mode, or other storage exceptions.
 *
 * @example
 * persistCache(localStorage, cacheEntries);
 */
export function persistCache(storage: Storage, entries: Map<string, CacheEntry>): void {
  try {
    const serialized = JSON.stringify(Object.fromEntries(entries));
    storage.setItem(STORAGE_KEY, serialized);
  } catch {
    // Best-effort — quota exceeded, private mode, etc.
  }
}

/**
 * Reconstructs a Map of cache entries from the provided Storage.
 *
 * Parses the stored JSON value at the module's STORAGE_KEY and includes only entries whose value is a non-array object containing a numeric `timestamp` property and a `data` property. Any missing, malformed, or unparsable storage content results in an empty Map.
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
        typeof (value as any).timestamp === 'number' &&
        'data' in value
      ) {
        entries.push([key, value as CacheEntry]);
      }
    }

    return new Map(entries);
  } catch {
    return new Map();
  }
}
