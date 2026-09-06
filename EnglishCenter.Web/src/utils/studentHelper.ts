import axios from 'axios';
import type { StudentFilterParams, StudentStatus } from '../types/student.types';
import { buildManagementQueryParams } from './queryHelper';

const VALID_STATUSES: StudentStatus[] = ['Active', 'Inactive', 'Graduated', 'Suspended'];
const VALID_SORT_FIELDS = ['id', 'studentCode', 'fullName', 'email', 'enrollmentDate', 'status'];

/**
 * Merges generic management query parameters with student-specific filters
 */
export function buildStudentQueryParams(
  params: StudentFilterParams
): Record<string, string | number> {
  const query = buildManagementQueryParams(params);

  if (params.status && VALID_STATUSES.includes(params.status)) {
    query.status = params.status;
  }

  if (params.currentLevel && params.currentLevel.trim().length > 0) {
    query.currentLevel = params.currentLevel.trim();
  }

  return query;
}

/**
 * Resolves the role-prefixed base path based primarily on the active URL prefix,
 * with fallback to user roles.
 */
export function getStudentBasePath(pathname: string, roles?: string[]): string {
  if (pathname.startsWith('/staff')) {
    return '/staff/students';
  }
  if (pathname.startsWith('/admin')) {
    return '/admin/students';
  }

  // Fallback if not within route prefix
  if (roles && roles.includes('STAFF') && !roles.includes('ADMIN')) {
    return '/staff/students';
  }
  return '/admin/students';
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
 * Validates and normalizes URL query parameters against whitelists to prevent crashes.
 */
export function normalizeStudentQueryParams(searchParams: URLSearchParams): StudentFilterParams {
  const params: StudentFilterParams = {};

  // Page
  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  params.page = !isNaN(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  // PageSize
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '10', 10);
  params.pageSize = [10, 20, 50].includes(pageSizeRaw) ? pageSizeRaw : 10;

  // Search
  const searchRaw = searchParams.get('search');
  if (searchRaw && searchRaw.trim().length > 0) {
    params.search = searchRaw.trim();
  }

  // Status
  const statusRaw = searchParams.get('status') as StudentStatus;
  if (statusRaw && VALID_STATUSES.includes(statusRaw)) {
    params.status = statusRaw;
  }

  // CurrentLevel
  const levelRaw = searchParams.get('currentLevel');
  if (levelRaw && levelRaw.trim().length > 0) {
    params.currentLevel = levelRaw.trim();
  }

  // SortBy
  const sortByRaw = searchParams.get('sortBy');
  if (sortByRaw && VALID_SORT_FIELDS.includes(sortByRaw)) {
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
 * Parses API error response and returns a clean, human-readable message.
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.';
    }

    const { status, data } = error.response;

    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này. (403 Forbidden)';
    }

    if (status === 404) {
      return 'Không tìm thấy thông tin học viên. (404 Not Found)';
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
