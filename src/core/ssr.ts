import type { CacheStore } from './cache';
import type { CacheEvent, DehydratedState } from './types';

/**
 * Serializes all valid cache entries into a JSON-safe snapshot.
 * Entries with errors or undefined data are excluded.
 * Stale entries ARE included — staleness is re-evaluated on the client.
 *
 * @example
 * // +page.server.ts
 * const serverCache = createCache();
 * await serverCache.prefetch({ key: 'todos', fn: fetchTodos });
 * return { dehydrated: serverCache.dehydrate() };
 */
export function dehydrate(store: CacheStore): DehydratedState {
  const entries: DehydratedState['entries'] = [];
  for (const [key, entry] of store.entries()) {
    if (entry.data === undefined || entry.error !== null) continue;
    entries.push({ key, data: entry.data, timestamp: entry.timestamp });
  }
  return { entries };
}

/**
 * Seeds a client-side cache from a server-side snapshot.
 * Additive — existing entries are never overwritten.
 * Preserves original timestamps so stale-while-revalidate works correctly.
 *
 * @example
 * // +page.svelte
 * cache.rehydrate(data.dehydrated);
 * const todos = cache.query({ key: 'todos', fn: fetchTodos }); // no loading flash
 */
export function rehydrate(
  store: CacheStore,
  state: DehydratedState,
  onEvent?: (event: CacheEvent) => void,
): void {
  const rehydratedKeys: unknown[][] = [];
  for (const { key, data, timestamp } of state.entries) {
    if (store.get(key) !== undefined) continue;
    store.set(key, { data, timestamp, error: null });
    rehydratedKeys.push(JSON.parse(key) as unknown[]);
  }
  if (rehydratedKeys.length > 0) {
    try {
      onEvent?.({ type: 'rehydrate', keys: rehydratedKeys });
    } catch {
      // silently swallow
    }
  }
}
