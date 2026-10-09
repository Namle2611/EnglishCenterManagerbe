import { axiosClient } from '../api/axiosClient';
import type {
  ApiResponse,
  ChangePasswordPayload,
  CurrentUserResponseData,
  LoginCredentials,
  LoginResponseData
} from '../types/auth.types';
import type {
  RegisterRequest,
  RegisterResponse,
  ResendOtpRequest,
  VerifyOtpRequest,
  VerifyOtpResponse
} from '../types/registration.types';

export const authService = {
  async register(data: RegisterRequest): Promise<ApiResponse<RegisterResponse>> {
    const response = await axiosClient.post<ApiResponse<RegisterResponse>>(
      '/auth/register',
      data
    );
    return response.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<ApiResponse<VerifyOtpResponse>> {
    const response = await axiosClient.post<ApiResponse<VerifyOtpResponse>>(
      '/auth/register/verify-otp',
      data
    );
    return response.data;
  },

  async resendOtp(data: ResendOtpRequest): Promise<ApiResponse> {
    const response = await axiosClient.post<ApiResponse>(
      '/auth/register/resend-otp',
      data
    );
    return response.data;
  },
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponseData>> {
    const response = await axiosClient.post<ApiResponse<LoginResponseData>>(
      '/auth/login',
      credentials
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

  async logout(): Promise<ApiResponse> {
    const response = await axiosClient.post<ApiResponse>(
      '/auth/logout',
      {},
      {
        headers: {
          'X-EC-CSRF': '1'
        }
      }
    );
    return response.data;
  }
};
