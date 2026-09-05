export interface User {
  id: number;
  email: string;
  fullName: string;
  roles: string[];
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
  errors: string[];
}

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  user: {
    id: number;
    email: string;
    fullName: string;
    roles: string[];
  };
}

export interface RefreshTokenResponseData {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
}

export interface CurrentUserResponseData {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  roles: string[];
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
