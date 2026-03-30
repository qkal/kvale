import { bench } from 'vitest';
import { CacheStore } from '../src/core/cache';

const NUM_ENTRIES = 10000;
const NUM_INVALIDATIONS = 100;

bench('invalidate cache', ({ store, prefixes }) => {
  // Run invalidations
  for (const prefix of prefixes) {
    store.invalidate(prefix);
  }
}, {
  setup() {
    const store = new CacheStore({ gcTime: 300_000 });

    // Fill cache
    for (let i = 0; i < NUM_ENTRIES; i++) {
      const key = JSON.stringify(['todos', i % 100, { id: i }]);
      store.set(key, { data: { val: i }, timestamp: Date.now(), error: null });
    }

    // Precompute prefixes
    const prefixes: string[] = [];
    for (let i = 0; i < NUM_INVALIDATIONS; i++) {
      prefixes.push(JSON.stringify(['todos', i % 100]));
    }

    return { store, prefixes };
  }
});