import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  CreateStudentPayload,
  StudentDetail,
  StudentFilterParams,
  StudentListItem,
  StudentStatus,
  UpdateStudentPayload,
  UpdateStudentStatusPayload
} from '../types/student.types';
import { buildStudentQueryParams } from '../utils/studentHelper';

export const studentService = {
  async getStudents(
    params: StudentFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<StudentListItem>>> {
    const queryParams = buildStudentQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<StudentListItem>>>('/students', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getStudentById(id: number, signal?: AbortSignal): Promise<ApiResponse<StudentDetail>> {
    const response = await axiosClient.get<ApiResponse<StudentDetail>>(`/students/${id}`, {
      signal
    });
    return response.data;
  },

  async createStudent(payload: CreateStudentPayload): Promise<ApiResponse<StudentDetail>> {
    const response = await axiosClient.post<ApiResponse<StudentDetail>>('/students', payload);
    return response.data;
  },

  async updateStudent(id: number, payload: UpdateStudentPayload): Promise<ApiResponse<StudentDetail>> {
    const response = await axiosClient.put<ApiResponse<StudentDetail>>(`/students/${id}`, payload);
    return response.data;
  },

  async updateStudentStatus(id: number, status: StudentStatus): Promise<ApiResponse<StudentDetail>> {
    const payload: UpdateStudentStatusPayload = { status };
    const response = await axiosClient.patch<ApiResponse<StudentDetail>>(`/students/${id}/status`, payload);
    return response.data;
  }
};
