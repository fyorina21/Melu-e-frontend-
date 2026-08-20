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
  token: string;
  role?: string;
  homeRoute?: string;
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
    const { data, headers } = await http.post<LoginResponse>('/auth/login', {
      email: payload.email,
      password: payload.password,
      remember_device: payload.rememberDevice,
    });
    const token = data.token ?? extractBearer(headers.authorization);
    if (token) await setAccessToken(token);
    return data;
  },

  async logout(): Promise<void> {
    try {
      await http.post('/auth/logout');
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
};