import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorBody, AuthResponse, TokenPair } from '@/types/api';

// Base URL for the FlowLens backend API, including the version prefix.
//
// In development, we deliberately use a *relative* path (/api/v1) so that
// every request goes through Vite's dev-server proxy (see vite.config.ts),
// which forwards /api/* to http://localhost:4000 server-side. This keeps
// the browser on the same origin — no CORS preflight — which means login
// keeps working regardless of which port Vite happens to bind to
// (3000, 3001, 5173, …) even though the backend's CORS_ORIGINS list only
// allows http://localhost:3000.
//
// For production, set VITE_API_BASE_URL to the full API URL instead.
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';

const ACCESS_TOKEN_KEY = 'flowlens_access_token';
const REFRESH_TOKEN_KEY = 'flowlens_refresh_token';

// Token storage is intentionally isolated to these two functions rather
// than sprinkled through components — if you ever swap localStorage for
// an httpOnly-cookie approach, this is the only file that changes.
export const tokenStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (tokens: TokenPair) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export const apiClient = axios.create({ baseURL: BASE_URL });

// ---- TEMPORARY DIAGNOSTIC LOGGING (remove after verifying login) ----
// Logs the exact URL the browser actually requests so we can confirm the
// relative /api/v1 proxy path is being used (vs. a stale absolute base URL).
if (import.meta.env.DEV) {
  console.log('[FlowLens] API BASE_URL =', BASE_URL);
}

apiClient.interceptors.request.use((config) => {
  const token = tokenStorage.getAccessToken();
  if (import.meta.env.DEV) {
    console.log('[FlowLens] REQUEST', config.method?.toUpperCase(), config.baseURL + (config.url ?? ''));
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// A short-lived promise used to de-duplicate concurrent refresh attempts:
// if 5 requests all get a 401 at the same moment (common when a token
// expires mid-page-load with several parallel queries in flight), we want
// exactly ONE refresh call, not five racing each other.
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await axios.post<{ data: TokenPair }>(`${BASE_URL}/auth/refresh`, { refreshToken });
    const tokens = response.data.data;
    tokenStorage.setTokens(tokens);
    return tokens.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthEndpoint = originalRequest?.url?.includes('/auth/login') || originalRequest?.url?.includes('/auth/register');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newAccessToken = await refreshPromise;

      if (newAccessToken) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      }

      // Refresh itself failed — the session is genuinely over. Redirect to
      // login rather than leaving the app stuck on a silently-failing page.
      tokenStorage.clear();
      window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);

/** Extracts a human-readable message from a failed request, however it failed. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.message) {
      return Array.isArray(body.message) ? body.message.join(' ') : body.message;
    }
    if (error.message) return error.message;
  }
  return 'Something went wrong. Please try again.';
}

export function unwrap<T>(promise: Promise<{ data: { data: T } }>): Promise<T> {
  return promise.then((res) => res.data.data);
}

export function unwrapPaginated<T>(promise: Promise<{ data: { data: T[]; meta: unknown } }>) {
  return promise.then((res) => ({ data: res.data.data, meta: res.data.meta })) as Promise<{
    data: T[];
    meta: import('@/types/api').PaginationMeta;
  }>;
}

export type { AuthResponse };
