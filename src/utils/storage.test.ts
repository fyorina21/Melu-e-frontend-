import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from './storage';

describe('Unified KeyValueStorage', () => {
  beforeEach(async () => {
    await storage.removeItem('test_key');
    await storage.removeItem('json_key');
  });

  it('sets and gets string values asynchronously', async () => {
    expect(await storage.getItem('test_key')).toBeNull();
    await storage.setItem('test_key', 'hello_world');
    expect(await storage.getItem('test_key')).toBe('hello_world');
    await storage.removeItem('test_key');
    expect(await storage.getItem('test_key')).toBeNull();
  });

  it('sets and gets string values synchronously', () => {
    storage.setSync('test_key', 'sync_val');
    expect(storage.getSync('test_key')).toBe('sync_val');
    storage.removeSync('test_key');
    expect(storage.getSync('test_key')).toBeNull();
  });

  it('handles JSON data serialization seamlessly', async () => {
    const payload = { id: 'std-1', score: 95, tags: ['aba', 'skills'] };
    await storage.setJSON('json_key', payload);
    const retrieved = await storage.getJSON<typeof payload>('json_key');
    expect(retrieved).toEqual(payload);

    storage.setJSONSync('json_key', { count: 42 });
    expect(storage.getJSONSync('json_key')).toEqual({ count: 42 });
  });

  it('returns fallback value if key does not exist or JSON is invalid', async () => {
    const res = await storage.getJSON('missing_key', { defaultVal: true });
    expect(res).toEqual({ defaultVal: true });
  });
});
