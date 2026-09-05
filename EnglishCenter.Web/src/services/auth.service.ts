import { axiosClient } from '../api/axiosClient';
import type {
  ApiResponse,
  ChangePasswordPayload,
  CurrentUserResponseData,
  LoginCredentials,
  LoginResponseData,
  RefreshTokenResponseData
} from '../types/auth.types';

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    const response = await axiosClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      credentials
    );
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<ApiResponse<RefreshTokenResponseData>> {
    const response = await axiosClient.post<ApiResponse<RefreshTokenResponseData>>(
      '/auth/refresh-token',
      { refreshToken }
    );
    return response.data;
  },

  async getMe(): Promise<ApiResponse<CurrentUserResponseData>> {
    const response = await axiosClient.get<ApiResponse<CurrentUserResponseData>>(
      '/auth/me'
    );
    return response.data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<ApiResponse> {
    const response = await axiosClient.post<ApiResponse>(
      '/auth/change-password',
      payload
    );
    return response.data;
  },

  async logout(refreshToken: string): Promise<ApiResponse> {
    const response = await axiosClient.post<ApiResponse>(
      '/auth/logout',
      { refreshToken }
    );
    return response.data;
  }
};
