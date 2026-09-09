import axios from 'axios';
import type { ClassFilterParams, ClassStatus } from '../types/class.types';
import { buildManagementQueryParams } from './queryHelper';

export const VALID_CLASS_STATUSES: ClassStatus[] = ['Planned', 'Ongoing', 'Completed', 'Cancelled'];

export const VALID_CLASS_SORT_FIELDS = [
  'id',
  'classCode',
  'startDate',
  'endDate',
  'maxStudents',
  'status',
  'courseName'
];

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  Planned: 'Dự kiến',
  Ongoing: 'Đang diễn ra',
  Completed: 'Đã hoàn thành',
  Cancelled: 'Đã hủy'
};

/**
 * Parses an ISO wall-clock string (e.g. 2026-10-01T08:00:00) into display format "08:00 01/10/2026"
 * Strictly avoids using new Date() to eliminate GMT/timezone offset conversions.
 */
export function formatClassDateTime(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return '-';
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) {
    return dateStr;
  }

  const [, year, month, day, hour, minute] = match;
  return `${hour}:${minute} ${day}/${month}/${year}`;
}

/**
 * Normalizes an API date string to "YYYY-MM-DDTHH:mm" for <input type="datetime-local" />
 */
export function formatDateTimeInput(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return '';
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  if (!match) {
    return '';
  }

  const [, year, month, day, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Normalizes an input datetime value (e.g. "2026-10-01T08:00") to "2026-10-01T08:00:00" for backend payload
 * Strictly avoids new Date().toISOString()
 */
export function normalizeDateTimePayload(val: string): string {
  const trimmed = val.trim();
  if (trimmed.length === 16) {
    // "YYYY-MM-DDTHH:mm"
    return `${trimmed}:00`;
  }
  return trimmed;
}

/**
 * Validates start date and end date
 * Ensures both are present and EndDate is strictly after StartDate
 */
export function validateDates(
  startDate: string,
  endDate: string
): { isValid: boolean; startError?: string; endError?: string } {
  let isValid = true;
  let startError: string | undefined;
  let endError: string | undefined;

  const startTrim = startDate.trim();
  const endTrim = endDate.trim();

  if (startTrim.length === 0) {
    startError = 'Thời gian bắt đầu là bắt buộc.';
    isValid = false;
  }

  if (endTrim.length === 0) {
    endError = 'Thời gian kết thúc là bắt buộc.';
    isValid = false;
  }

  if (isValid) {
    const normStart = normalizeDateTimePayload(startTrim);
    const normEnd = normalizeDateTimePayload(endTrim);

    if (normEnd <= normStart) {
      endError = 'Thời gian kết thúc phải sau thời gian bắt đầu.';
      isValid = false;
    }
  }

  return { isValid, startError, endError };
}

/**
 * Validates MaxStudents integer (> 0)
 */
export function validateMaxStudents(val: string): { isValid: boolean; value?: number; error?: string } {
  const trimmed = val.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Sĩ số tối đa là bắt buộc.' };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Sĩ số tối đa phải là số nguyên (không nhập số thập phân).' };
  }

  const num = parseInt(trimmed, 10);
  if (num <= 0) {
    return { isValid: false, error: 'Sĩ số tối đa phải lớn hơn 0.' };
  }

  return { isValid: true, value: num };
}

/**
 * Validates ClassCode
 */
export function validateClassCode(val: string): { isValid: boolean; error?: string } {
  const trimmed = val.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Mã lớp học là bắt buộc.' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Mã lớp học không được vượt quá 30 ký tự.' };
  }

  return { isValid: true };
}

/**
 * Merges common management query params with class-specific query parameters
 */
export function buildClassQueryParams(
  params: ClassFilterParams
): Record<string, string | number> {
  const query = buildManagementQueryParams(params);

  if (params.status && VALID_CLASS_STATUSES.includes(params.status)) {
    query.status = params.status;
  }

  if (params.courseId && typeof params.courseId === 'number' && params.courseId > 0) {
    query.courseId = params.courseId;
  }

  if (params.teacherId && typeof params.teacherId === 'number' && params.teacherId > 0) {
    query.teacherId = params.teacherId;
  }

  return query;
}

/**
 * Normalizes URL search parameters against whitelist to prevent invalid queries
 */
export function normalizeClassQueryParams(searchParams: URLSearchParams): ClassFilterParams {
  const params: ClassFilterParams = {};

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
  const statusRaw = searchParams.get('status') as ClassStatus;
  if (statusRaw && VALID_CLASS_STATUSES.includes(statusRaw)) {
    params.status = statusRaw;
  }

  // CourseId
  const courseIdRaw = parseInt(searchParams.get('courseId') || '', 10);
  if (!isNaN(courseIdRaw) && courseIdRaw > 0) {
    params.courseId = courseIdRaw;
  }

  // TeacherId
  const teacherIdRaw = parseInt(searchParams.get('teacherId') || '', 10);
  if (!isNaN(teacherIdRaw) && teacherIdRaw > 0) {
    params.teacherId = teacherIdRaw;
  }

  // SortBy
  const sortByRaw = searchParams.get('sortBy');
  if (sortByRaw && VALID_CLASS_SORT_FIELDS.includes(sortByRaw)) {
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
 * Deterministically resolves route base path based purely on pathname prefix
 */
export function getClassBasePath(pathname: string): string {
  if (pathname.startsWith('/staff')) {
    return '/staff/classes';
  }
  return '/admin/classes';
}

/**
 * Extracts human-readable error message from Axios API error
 */
export function getClassApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng.';
    }

    const { status, data } = error.response;

    if (status === 401) {
      return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    }

    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác này. (403 Forbidden)';
    }

    if (status === 404) {
      return 'Không tìm thấy thông tin lớp học. (404 Not Found)';
    }

    if (status === 409) {
      if (data && typeof data === 'object') {
        const d = data as { message?: string };
        if (d.message && d.message.trim().length > 0) {
          return d.message;
        }
      }
      return 'Mã lớp học đã tồn tại trong hệ thống. Vui lòng chọn mã khác.';
    }

    if (data && typeof data === 'object') {
      const responseData = data as { message?: string; errors?: string[] | Record<string, string[]> };
      if (responseData.errors) {
        if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
          return responseData.errors.join(' ');
        }
        if (typeof responseData.errors === 'object') {
          const flat = Object.values(responseData.errors).flat().filter(Boolean);
          if (flat.length > 0) {
            return flat.join(' ');
          }
        }
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
