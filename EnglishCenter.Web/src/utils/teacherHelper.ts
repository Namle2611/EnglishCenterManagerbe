import axios from 'axios';
import type { TeacherFilterParams, TeacherStatus } from '../types/teacher.types';
import { buildManagementQueryParams } from './queryHelper';

export const VALID_TEACHER_STATUSES: TeacherStatus[] = ['Active', 'Inactive'];

export const VALID_TEACHER_SORT_FIELDS = [
  'id',
  'teacherCode',
  'fullName',
  'email',
  'specialization',
  'experienceYears',
  'hireDate',
  'status'
];

export const VALID_PAGE_SIZES = [10, 20, 50];

/**
 * Merges generic management query parameters with teacher-specific filters
 */
export function buildTeacherQueryParams(
  params: TeacherFilterParams
): Record<string, string | number> {
  const query = buildManagementQueryParams(params);

  if (params.status && VALID_TEACHER_STATUSES.includes(params.status)) {
    query.status = params.status;
  }

  if (params.specialization && params.specialization.trim().length > 0) {
    query.specialization = params.specialization.trim();
  }

  return query;
}

/**
 * Validates and normalizes URL query parameters against whitelists to prevent crashes.
 */
export function normalizeTeacherQueryParams(searchParams: URLSearchParams): TeacherFilterParams {
  const params: TeacherFilterParams = {};

  // Page
  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  params.page = !isNaN(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  // PageSize: Whitelist [10, 20, 50] with fallback to 10
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '10', 10);
  params.pageSize = VALID_PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : 10;

  // Search
  const searchRaw = searchParams.get('search');
  if (searchRaw && searchRaw.trim().length > 0) {
    params.search = searchRaw.trim();
  }

  // Status
  const statusRaw = searchParams.get('status') as TeacherStatus;
  if (statusRaw && VALID_TEACHER_STATUSES.includes(statusRaw)) {
    params.status = statusRaw;
  }

  // Specialization
  const specRaw = searchParams.get('specialization');
  if (specRaw && specRaw.trim().length > 0) {
    params.specialization = specRaw.trim();
  }

  // SortBy
  const sortByRaw = searchParams.get('sortBy');
  if (sortByRaw && VALID_TEACHER_SORT_FIELDS.includes(sortByRaw)) {
    params.sortBy = sortByRaw;
  }

  // SortDirection
  const sortDirRaw = searchParams.get('sortDirection');
  if (sortDirRaw === 'asc' || sortDirRaw === 'desc') {
    params.sortDirection = sortDirRaw;
  }

  return params;
}

/**
 * Deterministically formats a date-only string (YYYY-MM-DD or ISO) to DD/MM/YYYY
 * without timezone shifts.
 */
export function formatDateOnly(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';

  const datePart = dateStr.length >= 10 ? dateStr.substring(0, 10) : dateStr;
  const parts = datePart.split('-');

  if (parts.length === 3 && parts[0].length === 4 && parts[1].length === 2 && parts[2].length === 2) {
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  }

  return datePart;
}

/**
 * Deterministically extracts YYYY-MM-DD string for HTML <input type="date">
 */
export function toDateInputValue(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  return dateStr.length >= 10 ? dateStr.substring(0, 10) : '';
}

/**
 * Parses API error response and returns a clean, human-readable message.
 */
export function getTeacherApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.';
    }

    const { status, data } = error.response;

    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này. (403 Forbidden)';
    }

    if (status === 404) {
      return 'Không tìm thấy thông tin giáo viên. (404 Not Found)';
    }

    if (data && typeof data === 'object') {
      const responseData = data as { message?: string; errors?: string[] };
      if (responseData.errors && Array.isArray(responseData.errors) && responseData.errors.length > 0) {
        return responseData.errors.join(' ');
      }
      if (responseData.message && responseData.message.trim().length > 0) {
        return responseData.message;
      }
    }

    if (status >= 500) {
      return 'Đã xảy ra lỗi hệ thống trên máy chủ. Vui lòng thử lại sau.';
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
}
