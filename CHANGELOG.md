# Changelog

## [0.1.0] — 2026-03-28

### Added
- `createCache()` factory with global config
- `cache.query()` returning reactive object with status discriminant
- `status`: `'idle' | 'loading' | 'refreshing' | 'success' | 'error'`
- `data`, `error`, `isStale`, `refetch()`
- `staleTime`, `refetchInterval`, `refetchOnWindowFocus`, `enabled`
- `enabled` accepts getter function for reactive dependent queries
- Retry with linear backoff (300ms * attempt)
- Optional `localStorage` persistence
- Works in `.svelte`, `.svelte.ts`, and `.ts` files
