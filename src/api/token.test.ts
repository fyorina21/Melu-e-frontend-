import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getAccessToken,
  setAccessToken,
  loadToken,
  getRefreshToken,
  setRefreshToken,
  loadRefreshToken,
  clearAuthTokens,
} from './token';

vi.mock('./config/env', () => ({ isDemoMode: false }));

beforeEach(async () => {
  await clearAuthTokens();
});

describe('token store', () => {
  it('is empty by default', async () => {
    expect(getAccessToken()).toBeNull();
    expect(await loadToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(await loadRefreshToken()).toBeNull();
  });

  it('stores and reads a token in memory + web localStorage', async () => {
    await setAccessToken('abc123');
    expect(getAccessToken()).toBe('abc123');
    expect(localStorage.getItem('melue.auth.token')).toBe('abc123');
    expect(await loadToken()).toBe('abc123');
  });

  it('stores and reads a refresh token in memory + web localStorage', async () => {
    await setRefreshToken('ref456');
    expect(getRefreshToken()).toBe('ref456');
    expect(localStorage.getItem('melue.auth.refresh_token')).toBe('ref456');
    expect(await loadRefreshToken()).toBe('ref456');
  });

  it('clears the token on null', async () => {
    await setAccessToken('abc123');
    await setAccessToken(null);
    expect(getAccessToken()).toBeNull();
    expect(localStorage.getItem('melue.auth.token')).toBeNull();
  });

  it('clears all tokens with clearAuthTokens', async () => {
    await setAccessToken('abc123');
    await setRefreshToken('ref456');
    await clearAuthTokens();
    expect(getAccessToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(localStorage.getItem('melue.auth.token')).toBeNull();
    expect(localStorage.getItem('melue.auth.refresh_token')).toBeNull();
  });
});