import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  CreatePaymentPayload,
  PaymentDetail,
  PaymentFilterParams,
  PaymentListItem,
  PaymentSummary,
  UpdatePaymentPayload,
  UpdatePaymentStatusPayload
} from '../types/payment.types';
import { buildPaymentQueryParams } from '../utils/paymentHelper';

export const paymentService = {
  async getPayments(
    params: PaymentFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<PaymentListItem>>> {
    const queryParams = buildPaymentQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<PaymentListItem>>>('/payments', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getPaymentById(id: number, signal?: AbortSignal): Promise<ApiResponse<PaymentDetail>> {
    const response = await axiosClient.get<ApiResponse<PaymentDetail>>(`/payments/${id}`, {
      signal
    });
    return response.data;
  },

  async getPaymentSummary(enrollmentId: number, signal?: AbortSignal): Promise<ApiResponse<PaymentSummary>> {
    const response = await axiosClient.get<ApiResponse<PaymentSummary>>(
      `/payments/enrollments/${enrollmentId}/summary`,
      {
        signal
      }
    );
    return response.data;
  },

  async createPayment(payload: CreatePaymentPayload): Promise<ApiResponse<PaymentDetail>> {
    const response = await axiosClient.post<ApiResponse<PaymentDetail>>('/payments', payload);
    return response.data;
  },

  async updatePayment(id: number, payload: UpdatePaymentPayload): Promise<ApiResponse<PaymentDetail>> {
    const response = await axiosClient.put<ApiResponse<PaymentDetail>>(`/payments/${id}`, payload);
    return response.data;
  },

  async updatePaymentStatus(
    id: number,
    payload: UpdatePaymentStatusPayload
  ): Promise<ApiResponse<PaymentDetail>> {
    const response = await axiosClient.patch<ApiResponse<PaymentDetail>>(`/payments/${id}/status`, payload);
    return response.data;
  },

  async deletePayment(id: number): Promise<void> {
    await axiosClient.delete(`/payments/${id}`);
  }
};
