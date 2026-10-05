import { axiosClient } from '../api/axiosClient';
import type { ApiResponse } from '../types/common.types';
import type {
  ClassGradebookResponse,
  GradeQueryParams,
  StudentClassGradeDetailResponse,
  StudentGradeSummaryResponse
} from '../types/grade.types';

export const gradeService = {
  /**
   * Get management Class Gradebook with student roster.
   */
  async getClassGradebook(
    classId: number,
    params: GradeQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<ClassGradebookResponse>> {
    const response = await axiosClient.get<ApiResponse<ClassGradebookResponse>>(
      `/grades/classes/${classId}`,
      {
        params: {
          search: params.search?.trim() || undefined,
          membershipStatus: params.membershipStatus || undefined,
          sortBy: params.sortBy || undefined,
          isAscending: params.isAscending !== undefined ? params.isAscending : undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * Get management drill-down detail for a specific student in a class.
   */
  async getStudentClassGradeDetail(
    classId: number,
    studentId: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<StudentClassGradeDetailResponse>> {
    const response = await axiosClient.get<ApiResponse<StudentClassGradeDetailResponse>>(
      `/grades/classes/${classId}/students/${studentId}`,
      { signal }
    );
    return response.data;
  },

  /**
   * Get student's personal overview grades across enrolled classes.
   */
  async getMyGrades(signal?: AbortSignal): Promise<ApiResponse<StudentGradeSummaryResponse[]>> {
    const response = await axiosClient.get<ApiResponse<StudentGradeSummaryResponse[]>>(
      '/grades/my',
      { signal }
    );
    return response.data;
  },

  /**
   * Get student's personal detail gradebook for a single enrolled class.
   */
  async getMyClassGradeDetail(
    classId: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<StudentClassGradeDetailResponse>> {
    const response = await axiosClient.get<ApiResponse<StudentClassGradeDetailResponse>>(
      `/grades/my/classes/${classId}`,
      { signal }
    );
    return response.data;
  }
};
