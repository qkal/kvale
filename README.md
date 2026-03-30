# Kvale

**Smart data layer for SvelteKit — fetch, cache, done.**

[![TypeScript](https://img.shields.io/badge/powered%20by-TypeScript-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/kvale)](https://npmjs.com/package/kvale)
[![license](https://img.shields.io/npm/l/kvale)](./LICENSE)
[![svelte](https://img.shields.io/badge/svelte-5%2B-ff3e00)](https://svelte.dev)
[![zero deps](https://img.shields.io/badge/dependencies-zero-brightgreen)](./package.json)

---

> **A statement from Kal, founder of [Complexia](https://complexia.org)**
>
> Software built for the age of AI must be transparent, auditable, and correct by design. As artificial intelligence becomes a native tool in development workflows — reviewing code, generating logic, suggesting patterns — the libraries and data layers it interacts with carry new responsibility. Ambiguous state, hidden side effects, and silent failures are not just developer experience problems: they become safety problems when AI reasoning depends on them. At Complexia, we believe the right response is to build tools that are small, honest, and fully traceable. Kvale is one expression of that commitment.
>
> — Kal ([@qkal](https://github.com/qkal))

---

Kvale is a **zero-dependency, runes-native data fetching and caching library** built from the ground up for SvelteKit and Svelte 5. It gives you stale-while-revalidate caching, background refetching, polling, persistence, and dependent queries — with an API so minimal it disappears into your code.

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
- **No `QueryClientProvider`** — call `createCache()` once and use it anywhere. Your app stays yours.
- **Works everywhere** — `.svelte`, `.svelte.ts`, and plain `.ts` files. The pure TypeScript core has zero framework dependencies and runs in any JS environment.
- **Stale-while-revalidate** — cached data is shown instantly while fresh data loads silently in the background. Users never see a blank state.
- **Reactive dependent queries** — `enabled: () => !!user.data?.id` just works. Svelte tracks it automatically.
- **Impossible states eliminated** — a single `status` discriminant (`'idle' | 'loading' | 'refreshing' | 'success' | 'error'`) replaces the footgun of boolean flags.
- **Zero dependencies** — ~3kb minified. Nothing else pulled in.

---

## Installation

Choose your package manager:

```bash
# Bun (recommended)
bun add kvale

# npm
npm install kvale

# pnpm
pnpm add kvale
```

**Peer dependency:** Svelte 5.25.0 or later.

---

## Quick Start

**Step 1: Create your cache instance**

Set up a shared cache in `$lib/cache.ts` — call this once per app:

```ts
// src/lib/cache.ts
import { createCache } from 'kvale';

export const cache = createCache({
  staleTime: 30_000,           // data stays fresh for 30s (default)
  retry: 1,                    // retry once on failure (default)
  refetchOnWindowFocus: true,  // refetch stale queries on tab focus (default)
});
```

**Step 2: Query data in any component**

Import the cache and call `cache.query()` in the `<script>` block:

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { cache } from '$lib/cache';

  interface Todo {
    id: number;
    title: string;
    completed: boolean;
  }

  const todos = cache.query<Todo[]>({
    key: 'todos',
    fn: () => fetch('/api/todos').then(r => r.json()),
  });
</script>

{#if todos.status === 'loading'}
  <p>Loading...</p>
{:else if todos.status === 'error'}
  <p>Something went wrong: {todos.error.message}</p>
{:else if todos.status === 'success'}
  <ul>
    {#each todos.data as todo}
      <li class:done={todo.completed}>{todo.title}</li>
    {/each}
  </ul>
{/if}

{#if todos.status === 'refreshing'}
  <small>Refreshing in background…</small>
{/if}
```

**Step 3: Do not destructure the result**

`QueryResult` is a reactive object. Destructuring breaks reactivity — always access properties directly:

```ts
// ✅ correct
todos.status
todos.data

// ❌ breaks reactivity
const { status, data } = todos;
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
| `loading` | First fetch in progress, no cached data available |
| `refreshing` | Background refetch — stale data is still visible |
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
    refetchInterval: 5_000, // refetch every 5 seconds
  });
</script>
```

### localStorage Persistence

Hydrate the cache from `localStorage` on page load so users never see a blank state on return visits.

```ts
// src/lib/cache.ts
import { createCache } from 'kvale';

export const cache = createCache({
  persist: localStorage,
});
```

### Reusable Query Function

Define queries once, use anywhere — in `.svelte`, `.svelte.ts`, or plain `.ts` files.

```ts
// src/lib/queries/todos.svelte.ts
import { cache } from '$lib/cache';

export function useTodos(status?: string) {
  return cache.query<Todo[]>({
    key: ['todos', { status }],
    fn: () => fetch(`/api/todos?status=${status ?? ''}`).then(r => r.json()),
  });
}
```

### Manual Refetch

Expose a refresh button to let users pull fresh data on demand.

```svelte
<script lang="ts">
  import { cache } from '$lib/cache';

  const todos = cache.query({ key: 'todos', fn: fetchTodos });
</script>

<button onclick={() => todos.refetch()}>
  {todos.status === 'refreshing' ? 'Refreshing…' : 'Refresh'}
</button>
```

### Disabled Query

Use `enabled` to conditionally skip fetching — useful for search inputs, authenticated routes, or multi-step flows.

```svelte
<script lang="ts">
  import { cache } from '$lib/cache';

  let searchTerm = $state('');

  const results = cache.query({
    key: ['search', searchTerm],
    fn: () => fetch(`/api/search?q=${searchTerm}`).then(r => r.json()),
    enabled: () => searchTerm.length > 2,
  });
</script>

<input bind:value={searchTerm} placeholder="Search…" />
```

---

## Roadmap

- **v1.1** — `cache.mutate()`, `cache.invalidate()`, request deduplication
- **v1.2** — SSR hydration bridge (`initialData` from SvelteKit `load()`), `cache.prefetch()`
- **v1.3** — Infinite queries, pagination helpers, garbage collection

---

## Contributing

We welcome contributions of all kinds. See [CONTRIBUTING.md](./CONTRIBUTING.md) to get started.

---

## License

BSD-2-Clause-Patent © Kal, founder of [Complexia](https://complexia.org)
