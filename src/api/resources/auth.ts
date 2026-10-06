// src/api/resources/auth.ts
//
// Authentication endpoints. The Rails backend exposes these through Rodauth
// JWT under `/api/v1/auth`. All return the access token via JSON `token` or
// the `Authorization` header.

import { http } from '../http/client';
import { setAccessToken, loadToken, setRefreshToken, getAccessToken, getRefreshToken } from '../token';

export interface LoginRequest {
  email: string;
  password: string;
  rememberDevice?: boolean;
}

export interface LoginResponse {
  token?: string;
  access_token?: string;
  refresh_token?: string;
  role?: string;
  homeRoute?: string;
  home_route?: string;
}

export interface CreateAccountRequest {
  email: string;
  password: string;
}

export interface CreateAccountResponse {
  status: 'ok';
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ResetPasswordResponse {
  status: 'ok';
}

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match ? match[1] : null;
}

export const authApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    await setAccessToken(null);
    const { data, headers } = await http.post<LoginResponse>('/auth/login', {
      email: payload.email,
      password: payload.password,
      remember_device: payload.rememberDevice,
    });
    const token = data.token ?? (data as any).access_token ?? extractBearer(headers.authorization);
    if (token) await setAccessToken(token);
    const refreshToken = (data as any).refresh_token;
    if (refreshToken) await setRefreshToken(refreshToken);
    return {
      ...data,
      token: token || '',
      role: data.role,
      homeRoute: data.homeRoute || (data as any).home_route,
    };
  },

  async logout(): Promise<void> {
    try {
      await http.post('/auth/logout');
    } catch (_ignored) {
      // Backend may respond 400 if token was already expired or invalid; local cleanup proceeds
    } finally {
      await setAccessToken(null);
      await setRefreshToken(null);
    }
  },

  // Rodauth jwt_refresh (POST /api/v1/auth/jwt-refresh). The backend only
  // accepts a refresh request while the access token is still valid, so callers
  // must refresh proactively before `exp`.
  async refresh(): Promise<string | null> {
    const current = getAccessToken();
    const stored = getRefreshToken();
    if (!current || !stored) return null;
    try {
      const { data } = await http.post<{ access_token?: string; token?: string; refresh_token?: string }>(
        '/auth/jwt-refresh',
        { refresh_token: stored },
        { headers: { Authorization: `Bearer ${current}` } },
      );
      const access = data?.access_token ?? data?.token;
      if (!access) return null;
      await setAccessToken(access);
      if (data?.refresh_token) await setRefreshToken(data.refresh_token);
      return access;
    } catch (err) {
      console.warn('Token refresh failed:', err);
      return null;
    }
  },

  async createAccount(payload: CreateAccountRequest): Promise<CreateAccountResponse> {
    const { data } = await http.post<CreateAccountResponse>('/auth/create-account', payload);
    return data;
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const { data } = await http.post<ResetPasswordResponse>('/auth/reset-password', payload);
    return data;
  },

  async restore(): Promise<string | null> {
    return loadToken();
  },

  async me(): Promise<{ id: string; name: string; email: string; role: string }> {
    const { data } = await http.get('/auth/me');
    return data;
  },
};