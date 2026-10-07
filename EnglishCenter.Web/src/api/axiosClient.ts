import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, RefreshTokenResponseData } from '../types/auth.types';
import { authStorage } from '../utils/authStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5137/api';

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach Bearer Access Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = authStorage.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Concurrency control for Refresh Token Rotation
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;
let refreshSessionVersion = -1;

/**
 * Shared token refresh coordination helper.
 * Reused across REST interceptors and SignalR accessTokenFactory.
 */
export async function refreshAccessToken(): Promise<string | null> {
  const sessionVersion = authStorage.getSessionVersion();
  if (isRefreshing && refreshPromise && refreshSessionVersion === sessionVersion) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshSessionVersion = sessionVersion;
  refreshPromise = (async () => {
    try {
      const response = await axios.post<ApiResponse<RefreshTokenResponseData>>(
        `${baseURL}/auth/refresh-token`,
        {},
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-EC-CSRF': '1'
          }
        }
      );

      // A late response must not restore credentials after logout or replace a new login.
      if (authStorage.getSessionVersion() !== sessionVersion) return null;

      if (response.data?.success && response.data.data) {
        const { accessToken } = response.data.data;
        authStorage.setAccessToken(accessToken);
        return accessToken;
      }

      authStorage.clear();
      return null;
    } catch {
      if (authStorage.getSessionVersion() === sessionVersion) authStorage.clear();
      return null;
    } finally {
      if (refreshSessionVersion === sessionVersion) {
        isRefreshing = false;
        refreshPromise = null;
      }
    }
  })();

  return refreshPromise;
}

// Response interceptor: Handle 401 and execute single refresh promise
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    const url = originalRequest.url || '';
    // Prevent loop on auth endpoints
    if (url.includes('/auth/login') || url.includes('/auth/refresh-token')) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
