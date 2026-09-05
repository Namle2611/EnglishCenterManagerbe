import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import type {
  ChangePasswordPayload,
  LoginCredentials,
  LoginResponseData,
  User
} from '../types/auth.types';
import { authStorage } from '../utils/authStorage';

export interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResponseData>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  restoreAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => authStorage.getUser());
  const [accessToken, setAccessToken] = useState<string | null>(() => authStorage.getAccessToken());
  const [refreshToken, setRefreshToken] = useState<string | null>(() => authStorage.getRefreshToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const restoreAuth = useCallback(async () => {
    const token = authStorage.getAccessToken();
    const storedRefresh = authStorage.getRefreshToken();

    if (!token && !storedRefresh) {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (response.success && response.data) {
        const u = response.data;
        const currentUser: User = {
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          roles: u.roles,
          phone: u.phone,
          avatarUrl: u.avatarUrl,
          isActive: u.isActive
        };
        setUser(currentUser);
        authStorage.setUser(currentUser);
        setAccessToken(authStorage.getAccessToken());
        setRefreshToken(authStorage.getRefreshToken());
      } else {
        authStorage.clear();
        setUser(null);
        setAccessToken(null);
        setRefreshToken(null);
      }
    } catch {
      authStorage.clear();
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  const login = async (credentials: LoginCredentials): Promise<LoginResponseData> => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      const { accessToken: newAccess, refreshToken: newRefresh, user: u } = response.data;
      authStorage.setTokens(newAccess, newRefresh);

      const loggedInUser: User = {
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        roles: u.roles,
        isActive: true
      };

      authStorage.setUser(loggedInUser);
      setUser(loggedInUser);
      setAccessToken(newAccess);
      setRefreshToken(newRefresh);

      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const currentRefresh = authStorage.getRefreshToken();
    if (currentRefresh) {
      try {
        await authService.logout(currentRefresh);
      } catch {
        // Ignore errors on logout to ensure local clear
      }
    }
    authStorage.clear();
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
  };

  const changePassword = async (payload: ChangePasswordPayload): Promise<void> => {
    const response = await authService.changePassword(payload);
    if (!response.success) {
      throw new Error(response.message || 'Change password failed');
    }
    // After changing password, all refresh tokens are revoked on backend; log out client
    await logout();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        logout,
        changePassword,
        restoreAuth
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
