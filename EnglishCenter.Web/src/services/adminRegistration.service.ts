import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  AdminRegistrationRequestDto,
  ApproveRegistrationRequest,
  RejectRegistrationRequest,
  RegistrationRequestQuery
} from '../types/registration.types';

export const adminRegistrationService = {
  async getRequests(
    query?: RegistrationRequestQuery
  ): Promise<ApiResponse<PagedResult<AdminRegistrationRequestDto>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<AdminRegistrationRequestDto>>>(
      '/admin/registration-requests',
      { params: query }
    );
    return response.data;
  },

  async approve(
    id: number,
    payload: ApproveRegistrationRequest
  ): Promise<ApiResponse> {
    const response = await axiosClient.post<ApiResponse>(
      `/admin/registration-requests/${id}/approve`,
      payload
    );
    return response.data;
  },

  async reject(
    id: number,
    payload: RejectRegistrationRequest
  ): Promise<ApiResponse> {
    const response = await axiosClient.post<ApiResponse>(
      `/admin/registration-requests/${id}/reject`,
      payload
    );
    return response.data;
  }
};
