import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  CourseDetail,
  CourseFilterParams,
  CourseListItem,
  CourseStatus,
  CreateCoursePayload,
  UpdateCoursePayload,
  UpdateCourseStatusPayload
} from '../types/course.types';
import { buildCourseQueryParams } from '../utils/courseHelper';

export const courseService = {
  async getCourses(
    params: CourseFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<CourseListItem>>> {
    const queryParams = buildCourseQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<CourseListItem>>>('/courses', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getCourseById(id: number, signal?: AbortSignal): Promise<ApiResponse<CourseDetail>> {
    const response = await axiosClient.get<ApiResponse<CourseDetail>>(`/courses/${id}`, {
      signal
    });
    return response.data;
  },

  async createCourse(payload: CreateCoursePayload): Promise<ApiResponse<CourseDetail>> {
    const response = await axiosClient.post<ApiResponse<CourseDetail>>('/courses', payload);
    return response.data;
  },

  async updateCourse(id: number, payload: UpdateCoursePayload): Promise<ApiResponse<CourseDetail>> {
    const response = await axiosClient.put<ApiResponse<CourseDetail>>(`/courses/${id}`, payload);
    return response.data;
  },

  async updateCourseStatus(id: number, status: CourseStatus): Promise<ApiResponse<CourseDetail>> {
    const payload: UpdateCourseStatusPayload = { status };
    const response = await axiosClient.patch<ApiResponse<CourseDetail>>(`/courses/${id}/status`, payload);
    return response.data;
  }
};
