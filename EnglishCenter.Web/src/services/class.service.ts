import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  ClassDetail,
  ClassFilterParams,
  ClassListItem,
  ClassStatus,
  CreateClassPayload,
  TeacherLookupItem,
  UpdateClassPayload,
  UpdateClassStatusPayload
} from '../types/class.types';
import { buildClassQueryParams } from '../utils/classHelper';

export const classService = {
  async getClasses(
    params: ClassFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<ClassListItem>>> {
    const queryParams = buildClassQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<ClassListItem>>>('/classes', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getClassById(id: number, signal?: AbortSignal): Promise<ApiResponse<ClassDetail>> {
    const response = await axiosClient.get<ApiResponse<ClassDetail>>(`/classes/${id}`, {
      signal
    });
    return response.data;
  },

  async createClass(payload: CreateClassPayload): Promise<ApiResponse<ClassDetail>> {
    const response = await axiosClient.post<ApiResponse<ClassDetail>>('/classes', payload);
    return response.data;
  },

  async updateClass(id: number, payload: UpdateClassPayload): Promise<ApiResponse<ClassDetail>> {
    const response = await axiosClient.put<ApiResponse<ClassDetail>>(`/classes/${id}`, payload);
    return response.data;
  },

  async updateClassStatus(id: number, status: ClassStatus): Promise<ApiResponse<ClassDetail>> {
    const payload: UpdateClassStatusPayload = { status };
    const response = await axiosClient.patch<ApiResponse<ClassDetail>>(`/classes/${id}/status`, payload);
    return response.data;
  },

  async getTeacherLookup(
    params: { page?: number; pageSize?: number; search?: string } = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<TeacherLookupItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<TeacherLookupItem>>>(
      '/classes/lookups/teachers',
      {
        params,
        signal
      }
    );
    return response.data;
  }
};
