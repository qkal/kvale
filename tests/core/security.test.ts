import { describe, expect, it } from 'vitest';
import { hydrateCache, persistCache } from '../../src/core/storage';
import type { CacheEntry } from '../../src/core/types';

function makeMockStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    get length() {
      return store.size;
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  };
}

describe('hydrateCache security', () => {
  it('should handle entries with missing properties', () => {
    const storage = makeMockStorage();
    storage.setItem('kvale-cache', JSON.stringify({
        'key1': { data: 'value1' } // missing timestamp
    }));

    const result = hydrateCache(storage);
    expect(result.has('key1')).toBe(false);
  });

  it('should handle non-object entries', () => {
    const storage = makeMockStorage();
    storage.setItem('kvale-cache', JSON.stringify({
        'key1': 'not an object'
    }));

    const result = hydrateCache(storage);
    expect(result.has('key1')).toBe(false);
  });

  it('should accept valid entries', () => {
    const storage = makeMockStorage();
    storage.setItem('kvale-cache', JSON.stringify({
        'key1': { data: 'value1', timestamp: 12345 }
    }));

    const result = hydrateCache(storage);
    expect(result.has('key1')).toBe(true);
    expect(result.get('key1')?.data).toBe('value1');
  });

  it('should filter out invalid entries from a mixed bag', () => {
    const storage = makeMockStorage();
    storage.setItem('kvale-cache', JSON.stringify({
        'valid': { data: 'ok', timestamp: 123 },
        'invalid1': { data: 'no timestamp' },
        'invalid2': { timestamp: 123 }, // no data
        'invalid3': 'not an object',
        'invalid4': null,
        'invalid5': []
    }));

    const result = hydrateCache(storage);
    expect(result.size).toBe(1);
    expect(result.has('valid')).toBe(true);
  });
});
