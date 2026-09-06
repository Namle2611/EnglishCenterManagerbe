import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  CreateTeacherPayload,
  TeacherDetail,
  TeacherFilterParams,
  TeacherListItem,
  TeacherStatus,
  UpdateTeacherPayload,
  UpdateTeacherStatusPayload
} from '../types/teacher.types';
import { buildTeacherQueryParams } from '../utils/teacherHelper';

export const teacherService = {
  async getTeachers(
    params: TeacherFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<TeacherListItem>>> {
    const queryParams = buildTeacherQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<TeacherListItem>>>('/teachers', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getTeacherById(id: number, signal?: AbortSignal): Promise<ApiResponse<TeacherDetail>> {
    const response = await axiosClient.get<ApiResponse<TeacherDetail>>(`/teachers/${id}`, {
      signal
    });
    return response.data;
  },

  async createTeacher(payload: CreateTeacherPayload): Promise<ApiResponse<TeacherDetail>> {
    const response = await axiosClient.post<ApiResponse<TeacherDetail>>('/teachers', payload);
    return response.data;
  },

  async updateTeacher(id: number, payload: UpdateTeacherPayload): Promise<ApiResponse<TeacherDetail>> {
    const response = await axiosClient.put<ApiResponse<TeacherDetail>>(`/teachers/${id}`, payload);
    return response.data;
  },

  async updateTeacherStatus(id: number, status: TeacherStatus): Promise<ApiResponse<TeacherDetail>> {
    const payload: UpdateTeacherStatusPayload = { status };
    const response = await axiosClient.patch<ApiResponse<TeacherDetail>>(`/teachers/${id}/status`, payload);
    return response.data;
  }
};
