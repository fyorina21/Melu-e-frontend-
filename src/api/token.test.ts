import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getAccessToken, setAccessToken, loadToken } from './token';

vi.mock('./config/env', () => ({ isDemoMode: false }));

beforeEach(async () => {
  await setAccessToken(null);
});

describe('token store', () => {
  it('is empty by default', async () => {
    expect(getAccessToken()).toBeNull();
    expect(await loadToken()).toBeNull();
  });

  it('stores and reads a token in memory + web localStorage', async () => {
    await setAccessToken('abc123');
    expect(getAccessToken()).toBe('abc123');
    expect(localStorage.getItem('melue.auth.token')).toBe('abc123');
    expect(await loadToken()).toBe('abc123');
  });

  it('clears the token on null', async () => {
    await setAccessToken('abc123');
    await setAccessToken(null);
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('melue.auth.token')).toBeNull();
  });
});