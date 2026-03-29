# Kvale

**Smart data layer for SvelteKit — fetch, cache, done.**

[![npm](https://img.shields.io/npm/v/kvale)](https://npmjs.com/package/kvale)
[![license](https://img.shields.io/npm/l/kvale)](./LICENSE)
[![svelte](https://img.shields.io/badge/svelte-5%2B-ff3e00)](https://svelte.dev)

---

Kvale is a **zero-dependency, runes-native data fetching and caching library** built from the ground up for SvelteKit and Svelte 5. It gives you stale-while-revalidate caching, background refetching, polling, persistence, and dependent queries — with an API so simple it disappears into your code.

No providers. No wrappers. No boilerplate. Just `createCache()` and `cache.query()`.

```svelte
<script lang="ts">
  import { cache } from '$lib/cache';

  const todos = cache.query<Todo[]>({
    key: 'todos',
    fn: () => fetch('/api/todos').then(r => r.json()),
  });
</script>

{#if todos.status === 'loading'}
  <p>Loading...</p>
{:else if todos.status === 'error'}
  <p>Error: {todos.error.message}</p>
{:else}
  {#each todos.data as todo}
    <p>{todo.title}</p>
  {/each}
{/if}
```

---

## Why Kvale?

- **Born in Svelte 5** — uses `$state` and `$effect` natively. No legacy store adapters, no `writable()`, no React-isms.
- **No `QueryClientProvider`** — just call `createCache()` once and use it anywhere.
- **Works everywhere** — `.svelte`, `.svelte.ts`, and plain `.ts` files. The pure TypeScript core has zero framework dependencies.
- **Stale-while-revalidate** — cached data is shown instantly while fresh data loads silently in the background.
- **Reactive dependent queries** — `enabled: () => !!user.data?.id` just works. Svelte tracks it automatically.
- **Zero dependencies** — ~3kb minified. Nothing else pulled in.

---

## Installation

```bash
# Bun
bun add kvale

# npm
npm install kvale

# pnpm
pnpm add kvale

# yarn
yarn add kvale
```

**Peer dependency:** Svelte 5.25.0 or later.

---

## Quick Start

```ts
// $lib/cache.ts
import { createCache } from 'kvale';

export const cache = createCache({
  staleTime: 30_000,          // data is fresh for 30s (default)
  retry: 1,                   // retry once on failure (default)
  refetchOnWindowFocus: true, // refetch stale data on tab focus (default)
});
```

```svelte
<!-- +page.svelte -->
<script lang="ts">
  import { cache } from '$lib/cache';

  const todos = cache.query<Todo[]>({
    key: 'todos',
    fn: () => fetch('/api/todos').then(r => r.json()),
  });
</script>

{#if todos.status === 'loading'}
  <p>Loading...</p>
{:else if todos.status === 'error'}
  <p>Error: {todos.error.message}</p>
{:else}
  {#each todos.data as todo}
    <p>{todo.title}</p>
  {/each}
{/if}
```

---

## API Reference

### `createCache(config?)`

Creates a shared cache instance. Call once per app, typically in `$lib/cache.ts`.

| Option | Type | Default | Description |
|---|---|---|---|
| `staleTime` | `number` | `30_000` | Milliseconds until cached data is considered stale |
| `retry` | `number` | `1` | Number of retries on fetch failure |
| `refetchOnWindowFocus` | `boolean` | `true` | Refetch stale queries when the tab regains focus |
| `persist` | `Storage` | `undefined` | Persist cache to storage (e.g. `localStorage`) |

### `cache.query<T>(config)`

Creates a reactive query bound to the cache. Returns a `QueryResult<T>`.

| Option | Type | Description |
|---|---|---|
| `key` | `string \| unknown[]` | Cache key. Strings auto-wrap to `[string]`. |
| `fn` | `() => Promise<T>` | Async function that fetches the data |
| `staleTime` | `number?` | Per-query override of global `staleTime` |
| `refetchInterval` | `number?` | Poll interval in ms. Omit to disable polling. |
| `enabled` | `boolean \| (() => boolean)?` | Set `false` or return `false` to skip the query |

### `QueryResult<T>`

The reactive object returned by `cache.query()`. Access properties directly — do not destructure.

| Property | Type | Description |
|---|---|---|
| `status` | `'idle' \| 'loading' \| 'refreshing' \| 'success' \| 'error'` | Current fetch state |
| `data` | `T \| undefined` | The fetched data, or `undefined` before first success |
| `error` | `Error \| null` | The last error, or `null` |
| `isStale` | `boolean` | `true` when data is older than `staleTime` |
| `refetch()` | `() => Promise<void>` | Manually trigger a refetch |

**Status reference:**

| Status | Meaning |
|---|---|
| `idle` | Query is disabled (`enabled: false`) |
| `loading` | First fetch in progress, no cached data |
| `refreshing` | Background refetch with stale data still visible |
| `success` | Data loaded successfully |
| `error` | Fetch failed after all retries |

---

## Examples

### Dependent Query

Run a query only when another query's data is ready.

```svelte
<script lang="ts">
  import { cache } from '$lib/cache';

  const user = cache.query({
    key: 'user',
    fn: () => fetch('/api/me').then(r => r.json()),
  });

  const posts = cache.query({
    key: ['posts', user.data?.id],
    fn: () => fetch(`/api/posts?user=${user.data!.id}`).then(r => r.json()),
    enabled: () => !!user.data?.id,
  });
</script>
```

### Polling

Keep data fresh by refetching on an interval.

```svelte
<script lang="ts">
  import { cache } from '$lib/cache';

  const prices = cache.query({
    key: 'crypto-prices',
    fn: () => fetch('/api/prices').then(r => r.json()),
    refetchInterval: 5_000,
  });
</script>
```

### localStorage Persistence

Hydrate the cache from localStorage on page load so users never see a blank state.

```ts
// $lib/cache.ts
import { createCache } from 'kvale';

export const cache = createCache({
  persist: localStorage,
});
```

### Reusable Query Function

Define queries once, use anywhere — in `.svelte`, `.svelte.ts`, or plain `.ts`.

```ts
// queries/todos.svelte.ts
import { cache } from '$lib/cache';

export function useTodos(status?: string) {
  return cache.query<Todo[]>({
    key: ['todos', { status }],
    fn: () => fetch(`/api/todos?status=${status ?? ''}`).then(r => r.json()),
  });
}
```

### Manual Refetch

```svelte
<script lang="ts">
  const todos = cache.query({ key: 'todos', fn: fetchTodos });
</script>

<button onclick={() => todos.refetch()}>Refresh</button>
```

---

## Roadmap

- **v1.1** — `cache.mutate()`, `cache.invalidate()`, request deduplication
- **v1.2** — SSR hydration bridge (`initialData` from SvelteKit `load()`), `cache.prefetch()`
- **v1.3** — Infinite queries, pagination helpers, garbage collection

---

## Built by Complexia

Kvale is an open source project by **[Complexia](https://complexia.org)** — a software studio founded by **[Kal](https://github.com/qkal)** with a simple belief: the best tools are the ones that get out of your way.

We build libraries and products that make development more intuitive, more enjoyable, and more productive. Not by abstracting away complexity — but by designing it out entirely. Every API we ship is one we'd want to use ourselves.

Our vision is a future where developers spend their time building things that matter, armed with tools that are small, honest, and correct. Kvale is one small piece of that.

---

## Contributing

We welcome contributions of all kinds. See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

## License

MIT © [Complexia](https://complexia.org)
