import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, RefreshTokenResponseData } from '../types/auth.types';
import { authStorage } from '../utils/authStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5137/api';

export const axiosClient = axios.create({
  baseURL,
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

    const refreshToken = authStorage.getRefreshToken();
    if (!refreshToken) {
      authStorage.clear();
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = (async () => {
        try {
          const response = await axios.post<ApiResponse<RefreshTokenResponseData>>(
            `${baseURL}/auth/refresh-token`,
            { refreshToken }
          );

          if (response.data?.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            authStorage.setTokens(accessToken, newRefreshToken);
            return accessToken;
          }

          authStorage.clear();
          return null;
        } catch {
          authStorage.clear();
          return null;
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      })();
    }

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return axiosClient(originalRequest);
    }

    return Promise.reject(error);
  }
);
