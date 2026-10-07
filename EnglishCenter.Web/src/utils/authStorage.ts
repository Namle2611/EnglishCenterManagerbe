import type { User } from '../types/auth.types';

const ACCESS_TOKEN_KEY = 'ec_access_token';
const USER_KEY = 'ec_user';

// Discard credentials persisted by releases before the HttpOnly cookie migration.
localStorage.removeItem('ec_refresh_token');

let sessionVersion = 0;

export const authStorage = {
  getSessionVersion(): number {
    return sessionVersion;
  },
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  setAccessToken(accessToken: string): void {
    sessionVersion++;
    localStorage.removeItem('ec_refresh_token');
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  },

  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  setUser(user: User | null): void {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },

  clear(): void {
    sessionVersion++;
    localStorage.removeItem('ec_refresh_token');
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};
