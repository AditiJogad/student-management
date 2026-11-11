import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from '../config';
import type { ApiError } from '../types';

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

/** Wired up by the store so this module never imports Redux (avoids circular imports). */
export const setAuthToken = (t: string | null) => {
  authToken = t;
};
export const setUnauthorizedHandler = (fn: () => void) => {
  onUnauthorized = fn;
};

http.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error: AxiosError) => {
    // Expired / invalid token on a protected call -> force logout.
    // (Login/register 401s carry credentials errors and must not log anyone out.)
    const url = error.config?.url ?? '';
    const isAuthCall = url.includes('/api/auth/login') || url.includes('/api/auth/register');
    if (error.response?.status === 401 && !isAuthCall && authToken) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

/** Normalises anything thrown by axios into the app's ApiError shape. */
export function toApiError(err: unknown): ApiError {
  const e = err as AxiosError<{ message?: string; fieldErrors?: Record<string, string> }>;
  if (e?.response) {
    return {
      status: e.response.status,
      message: e.response.data?.message ?? `Request failed (${e.response.status})`,
      fieldErrors: e.response.data?.fieldErrors,
    };
  }
  if (e?.code === 'ECONNABORTED') return { status: 0, message: 'Request timed out. Is the server running?' };
  return { status: 0, message: `Cannot reach server at ${API_BASE_URL}. Check your network / API URL.` };
}
