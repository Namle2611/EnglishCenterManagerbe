import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  CreateSchedulePayload,
  ScheduleDetail,
  ScheduleFilterParams,
  ScheduleListItem,
  UpdateSchedulePayload
} from '../types/schedule.types';
import { buildScheduleQueryParams } from '../utils/scheduleHelper';

export const scheduleService = {
  async getSchedules(
    params: ScheduleFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<ScheduleListItem>>> {
    const queryParams = buildScheduleQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<ScheduleListItem>>>('/schedules', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getScheduleById(id: number, signal?: AbortSignal): Promise<ApiResponse<ScheduleDetail>> {
    const response = await axiosClient.get<ApiResponse<ScheduleDetail>>(`/schedules/${id}`, {
      signal
    });
    return response.data;
  },

  async createSchedule(payload: CreateSchedulePayload): Promise<ApiResponse<ScheduleDetail>> {
    const response = await axiosClient.post<ApiResponse<ScheduleDetail>>('/schedules', payload);
    return response.data;
  },

  async updateSchedule(id: number, payload: UpdateSchedulePayload): Promise<ApiResponse<ScheduleDetail>> {
    const response = await axiosClient.put<ApiResponse<ScheduleDetail>>(`/schedules/${id}`, payload);
    return response.data;
  },

  async deleteSchedule(id: number): Promise<void> {
    await axiosClient.delete(`/schedules/${id}`);
  }
};
