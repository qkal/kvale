import { describe, expect, it, vi } from 'vitest';
import { CacheStore } from '../../src/core/cache';
import { dehydrate, rehydrate } from '../../src/core/ssr';

describe('dehydrate', () => {
  it('returns empty entries for empty cache', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    expect(dehydrate(store)).toEqual({ entries: [] });
  });

  it('includes fresh entries with correct shape', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    const ts = Date.now();
    store.set('["todos"]', { data: [1, 2], timestamp: ts, error: null });
    const result = dehydrate(store);
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0]).toEqual({ key: '["todos"]', data: [1, 2], timestamp: ts });
  });

  it('includes stale entries — staleness is re-evaluated client-side', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    store.set('["todos"]', { data: [1], timestamp: 0, error: null });
    expect(dehydrate(store).entries).toHaveLength(1);
  });

  it('excludes entries with non-null error', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    store.set('["todos"]', { data: undefined, timestamp: Date.now(), error: new Error('fail') });
    expect(dehydrate(store).entries).toHaveLength(0);
  });

  it('excludes entries with undefined data', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    store.set('["todos"]', { data: undefined, timestamp: Date.now(), error: null });
    expect(dehydrate(store).entries).toHaveLength(0);
  });
});

describe('rehydrate', () => {
  it('populates cache entries from state', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    const ts = Date.now();
    rehydrate(store, { entries: [{ key: '["todos"]', data: [1, 2], timestamp: ts }] });
    expect(store.get('["todos"]')).toEqual({ data: [1, 2], timestamp: ts, error: null });
  });

  it('preserves original timestamps', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    const ts = Date.now() - 20_000;
    rehydrate(store, { entries: [{ key: '["todos"]', data: [1], timestamp: ts }] });
    expect(store.get('["todos"]')?.timestamp).toBe(ts);
  });

  it('is additive — does not overwrite existing entries', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    const existingTs = Date.now();
    store.set('["todos"]', { data: ['existing'], timestamp: existingTs, error: null });
    rehydrate(store, { entries: [{ key: '["todos"]', data: ['from-server'], timestamp: 0 }] });
    expect(store.get('["todos"]')?.data).toEqual(['existing']);
  });

  it('calling twice is safe (idempotent)', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    const ts = Date.now();
    const state = { entries: [{ key: '["todos"]', data: [1], timestamp: ts }] };
    rehydrate(store, state);
    rehydrate(store, state);
    expect(store.get('["todos"]')?.data).toEqual([1]);
  });

  it('fires onEvent with type rehydrate and correct keys', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    const onEvent = vi.fn();
    rehydrate(store, { entries: [{ key: '["todos"]', data: [1], timestamp: Date.now() }] }, onEvent);
    expect(onEvent).toHaveBeenCalledWith({ type: 'rehydrate', keys: [['todos']] });
  });

  it('does not fire onEvent when no new entries are written', () => {
    const store = new CacheStore({ gcTime: 300_000 });
    const onEvent = vi.fn();
    // Pre-populate so rehydrate skips
    store.set('["todos"]', { data: [1], timestamp: Date.now(), error: null });
    rehydrate(store, { entries: [{ key: '["todos"]', data: [2], timestamp: 0 }] }, onEvent);
    expect(onEvent).not.toHaveBeenCalled();
  });
});
