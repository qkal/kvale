/**
 * Status of a query. Represents mutually exclusive states — only one is true at a time.
 *
 * - `idle`       Query has not executed. Either `enabled` is false, or it just initialized.
 * - `loading`    First fetch in progress with no cached data.
 * - `refreshing` Background refetch in progress; stale data is visible.
 * - `success`    Fetch completed successfully.
 * - `error`      All retries exhausted; `error` is set.
 */
export type QueryStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

/**
 * Global cache configuration, passed to `createCache()`.
 *
 * @example
 * createCache({ staleTime: 60_000, retry: 2, refetchOnWindowFocus: false })
 */
export interface CacheConfig {
  /** Milliseconds before cached data is considered stale. Default: 30_000 */
  staleTime: number;
  /** Number of retry attempts on fetch failure. Default: 1 */
  retry: number;
  /** Refetch stale queries when the browser tab regains focus. Default: true */
  refetchOnWindowFocus: boolean;
  /** Optional Storage for cache persistence across page loads. Default: undefined */
  persist?: Storage;
}

/**
 * Per-query configuration, passed to `cache.query()`.
 *
 * @example
 * cache.query<Todo[]>({
 *   key: 'todos',
 *   fn: () => fetch('/api/todos').then(r => r.json()),
 *   enabled: () => !!userId,
 * })
 */
export interface QueryConfig<T> {
  /** Cache key. String auto-wraps to array: `'todos'` → `['todos']` */
  key: string | unknown[];
  /** Async function that returns the data. */
  fn: () => Promise<T>;
  /** Override global staleTime for this query only. */
  staleTime?: number;
  /** Auto-refetch interval in ms. Undefined = no polling. */
  refetchInterval?: number;
  /**
   * Whether to execute the query. Accepts a getter function for reactive
   * dependent queries: `enabled: () => !!user.data?.id`
   */
  enabled?: boolean | (() => boolean);
}

/**
 * Internal reactive state of a query.
 */
export interface QueryState<T> {
  status: QueryStatus;
  data: T | undefined;
  error: Error | null;
  isStale: boolean;
}

/**
 * A single cached entry stored in CacheStore.
 */
export interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  error: Error | null;
}

/** Callback type for QueryRunner subscribers. */
export type QuerySubscriber<T> = (state: QueryState<T>) => void;

// ─── Default constants ────────────────────────────────────────────────────────

export const DEFAULT_STALE_TIME = 30_000;
export const DEFAULT_RETRY = 1;
export const DEFAULT_REFETCH_ON_WINDOW_FOCUS = true;

export const CACHE_DEFAULTS: CacheConfig = {
  staleTime: DEFAULT_STALE_TIME,
  retry: DEFAULT_RETRY,
  refetchOnWindowFocus: DEFAULT_REFETCH_ON_WINDOW_FOCUS,
  persist: undefined,
};
