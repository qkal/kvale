import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('persistCache + hydrateCache', () => {
  let storage: Storage;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    storage = makeMockStorage();
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('round-trips a single cache entry', () => {
    const entry: CacheEntry = { data: { id: 1, title: 'Buy milk' }, timestamp: 1000, error: null };
    const entries = new Map([['["todos"]', entry]]);

    persistCache(storage, entries);
    const result = hydrateCache(storage);

    expect(result.get('["todos"]')).toEqual(entry);
  });

  it('round-trips multiple entries', () => {
    const entries = new Map<string, CacheEntry>([
      ['["todos"]', { data: [1, 2], timestamp: 1000, error: null }],
      ['["user"]', { data: { name: 'Kal' }, timestamp: 2000, error: null }],
    ]);

    persistCache(storage, entries);
    const result = hydrateCache(storage);

    expect(result.size).toBe(2);
    expect(result.get('["user"]')?.data).toEqual({ name: 'Kal' });
  });

  it('returns empty Map when storage is empty', () => {
    expect(hydrateCache(storage).size).toBe(0);
  });

  it('returns empty Map when storage contains corrupted JSON', () => {
    storage.setItem('kvale-cache', 'not valid json {{{');
    expect(hydrateCache(storage).size).toBe(0);
  });

  it('returns empty Map when storage contains null JSON value', () => {
    storage.setItem('kvale-cache', 'null');
    expect(hydrateCache(storage).size).toBe(0);
  });

  it('swallows persistCache write errors and warns once', () => {
    const brokenStorage = {
      ...makeMockStorage(),
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };

    expect(() => persistCache(brokenStorage as Storage, new Map())).not.toThrow();
    expect(() => persistCache(brokenStorage as Storage, new Map())).not.toThrow();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[kvale] Failed to persist cache:',
      expect.objectContaining({ message: 'QuotaExceededError' }),
    );
  });

  it('returns empty map for hydrate errors and warns once', () => {
    const brokenStorage = {
      ...makeMockStorage(),
      getItem: () => {
        throw new Error('StorageReadError');
      },
    };

    expect(hydrateCache(brokenStorage as Storage)).toEqual(new Map());
    expect(hydrateCache(brokenStorage as Storage)).toEqual(new Map());
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      '[kvale] Failed to hydrate cache:',
      expect.objectContaining({ message: 'StorageReadError' }),
    );
  });
});
