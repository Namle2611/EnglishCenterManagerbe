import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  AttendanceDetail,
  AttendanceListItem,
  AttendanceQueryParams,
  AttendanceSessionRoster,
  BulkUpsertAttendancePayload,
  CreateAttendancePayload,
  TeacherClassLookupItem,
  TeacherClassLookupParams,
  UpdateAttendancePayload
} from '../types/attendance.types';

export const attendanceService = {
  async getAttendances(
    params: AttendanceQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<AttendanceListItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<AttendanceListItem>>>('/attendances', {
      params,
      signal
    });
    return response.data;
  },

  async getAttendanceById(id: number, signal?: AbortSignal): Promise<ApiResponse<AttendanceDetail>> {
    const response = await axiosClient.get<ApiResponse<AttendanceDetail>>(`/attendances/${id}`, {
      signal
    });
    return response.data;
  },

  async getSessionRoster(
    params: { classId: number; sessionDate: string; startTime: string },
    signal?: AbortSignal
  ): Promise<ApiResponse<AttendanceSessionRoster>> {
    const response = await axiosClient.get<ApiResponse<AttendanceSessionRoster>>('/attendances/session', {
      params,
      signal
    });
    if (response.data && response.data.data) {
      response.data.data.isExistingSession = Boolean(response.data.data.attendanceSessionId);
    }
    return response.data;
  },

  async createAttendance(payload: CreateAttendancePayload): Promise<ApiResponse<AttendanceDetail>> {
    const response = await axiosClient.post<ApiResponse<AttendanceDetail>>('/attendances', payload);
    return response.data;
  },

  async updateAttendance(
    id: number,
    payload: UpdateAttendancePayload
  ): Promise<ApiResponse<AttendanceDetail>> {
    const response = await axiosClient.put<ApiResponse<AttendanceDetail>>(`/attendances/${id}`, payload);
    return response.data;
  },

  async bulkUpsertSession(
    payload: BulkUpsertAttendancePayload
  ): Promise<ApiResponse<AttendanceSessionRoster>> {
    const response = await axiosClient.put<ApiResponse<AttendanceSessionRoster>>('/attendances/session', payload);
    if (response.data && response.data.data) {
      response.data.data.isExistingSession = Boolean(response.data.data.attendanceSessionId);
    }
    return response.data;
  },

  async getTeacherClassesLookup(
    params: TeacherClassLookupParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<TeacherClassLookupItem>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<TeacherClassLookupItem>>>(
      '/attendances/lookups/classes',
      {
        params,
        signal
      }
    );
    return response.data;
  }
};
