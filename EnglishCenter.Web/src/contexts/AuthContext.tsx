import React, { createContext, useCallback, useEffect, useRef, useState } from 'react';
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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const authOperation = useRef(0);

  const restoreAuth = useCallback(async () => {
    const operation = authOperation.current;
    const token = authStorage.getAccessToken();

    if (!token) {
      authStorage.clear();
      setUser(null);
      setAccessToken(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await authService.getMe();
      if (operation !== authOperation.current) return;
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
      } else {
        authStorage.clear();
        setUser(null);
        setAccessToken(null);
      }
    } catch {
      if (operation !== authOperation.current) return;
      authStorage.clear();
      setUser(null);
      setAccessToken(null);
    } finally {
      if (operation === authOperation.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreAuth();
  }, [restoreAuth]);

  const login = async (credentials: LoginCredentials): Promise<LoginResponseData> => {
    const operation = ++authOperation.current;
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Login failed');
      }

      if (operation !== authOperation.current) {
        throw new Error('Sign-in was superseded by another authentication action.');
      }

      const { accessToken: newAccess, user: u } = response.data;
      authStorage.setAccessToken(newAccess);

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

      return response.data;
    } finally {
      if (operation === authOperation.current) setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    const operation = ++authOperation.current;
    try {
      await authService.logout();
    } catch {
      // Ignore errors on logout to ensure local clear
    } finally {
      if (operation === authOperation.current) {
        authStorage.clear();
        setUser(null);
        setAccessToken(null);
        setIsLoading(false);
      }
    }
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
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        logout,
        changePassword,
        restoreAuth
      }}
    >
      <React.Fragment key={user?.id ?? 'signed-out'}>{children}</React.Fragment>
    </AuthContext.Provider>
  );
};
