// src/api/resources/auth.ts
//
// Authentication endpoints. The Rails backend exposes these through Rodauth
// JWT under `/api/v1/auth`. All return the access token via JSON `token` or
// the `Authorization` header.

import { http } from '../http/client';
import { setAccessToken, loadToken } from '../token';

export interface LoginRequest {
  email: string;
  password: string;
  rememberDevice?: boolean;
}

export interface LoginResponse {
  token?: string;
  access_token?: string;
  role?: string;
  roles?: string[];
  homeRoute?: string;
  home_route?: string;
  modules?: string[];
  permissions?: string[];
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
    // Persist only when "remember this device" was ticked. Unchecked means the
    // session lives for this app run only and is gone after a restart.
    if (token) await setAccessToken(token, !!payload.rememberDevice);
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

  async me(): Promise<{
    id: string;
    name: string;
    email: string;
    role: string;
    roles?: string[];
    modules?: string[];
    permissions?: string[];
  }> {
    const { data } = await http.get<{
      id: string;
      name: string;
      email: string;
      role: string;
      roles?: string[];
      modules?: string[];
      permissions?: string[];
    }>('/auth/me');
    return data;
  },
};
