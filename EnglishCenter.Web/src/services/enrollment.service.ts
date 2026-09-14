import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type { ClassListItem } from '../types/class.types';
import type {
  CreateEnrollmentPayload,
  EnrollmentDetail,
  EnrollmentFilterParams,
  EnrollmentListItem,
  UpdateEnrollmentPayload,
  UpdateEnrollmentStatusPayload
} from '../types/enrollment.types';
import { classService } from './class.service';
import { buildEnrollmentQueryParams } from '../utils/enrollmentHelper';

export const enrollmentService = {
  async getEnrollments(
    params: EnrollmentFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<EnrollmentListItem>>> {
    const queryParams = buildEnrollmentQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<EnrollmentListItem>>>('/enrollments', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getEnrollmentById(id: number, signal?: AbortSignal): Promise<ApiResponse<EnrollmentDetail>> {
    const response = await axiosClient.get<ApiResponse<EnrollmentDetail>>(`/enrollments/${id}`, {
      signal
    });
    return response.data;
  },

  async createEnrollment(payload: CreateEnrollmentPayload): Promise<ApiResponse<EnrollmentDetail>> {
    const response = await axiosClient.post<ApiResponse<EnrollmentDetail>>('/enrollments', payload);
    return response.data;
  },

  async updateEnrollment(id: number, payload: UpdateEnrollmentPayload): Promise<ApiResponse<EnrollmentDetail>> {
    const response = await axiosClient.put<ApiResponse<EnrollmentDetail>>(`/enrollments/${id}`, payload);
    return response.data;
  },

  async updateEnrollmentStatus(
    id: number,
    payload: UpdateEnrollmentStatusPayload
  ): Promise<ApiResponse<EnrollmentDetail>> {
    const response = await axiosClient.patch<ApiResponse<EnrollmentDetail>>(`/enrollments/${id}/status`, payload);
    return response.data;
  },

  async deleteEnrollment(id: number): Promise<void> {
    await axiosClient.delete(`/enrollments/${id}`);
  }
};

/**
 * Paginates through all Planned and Ongoing classes for a course,
 * merging, deduplicating, and sorting alphabetically by ClassCode.
 * Guarantees classes beyond page 1 are never omitted.
 */
export async function fetchEligibleClassesForEnrollment(
  courseId: number,
  signal?: AbortSignal
): Promise<ClassListItem[]> {
  const accumulated: ClassListItem[] = [];

  // 1. Page through all Planned classes
  let plannedPage = 1;
  let plannedTotalPages = 1;
  while (plannedPage <= plannedTotalPages) {
    const res = await classService.getClasses(
      { courseId, status: 'Planned', page: plannedPage, pageSize: 100 },
      signal
    );
    if (res.data?.items) {
      accumulated.push(...res.data.items);
      plannedTotalPages = res.data.totalPages || 1;
    }
    plannedPage++;
  }

  // 2. Page through all Ongoing classes
  let ongoingPage = 1;
  let ongoingTotalPages = 1;
  while (ongoingPage <= ongoingTotalPages) {
    const res = await classService.getClasses(
      { courseId, status: 'Ongoing', page: ongoingPage, pageSize: 100 },
      signal
    );
    if (res.data?.items) {
      accumulated.push(...res.data.items);
      ongoingTotalPages = res.data.totalPages || 1;
    }
    ongoingPage++;
  }

  // 3. Deduplicate by id and sort by classCode
  const classMap = new Map<number, ClassListItem>();
  for (const item of accumulated) {
    if (!classMap.has(item.id)) {
      classMap.set(item.id, item);
    }
  }

  return Array.from(classMap.values()).sort((a, b) => a.classCode.localeCompare(b.classCode));
}
