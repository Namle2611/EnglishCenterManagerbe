import axios from 'axios';
import type { CourseFilterParams, CourseStatus } from '../types/course.types';
import { buildManagementQueryParams } from './queryHelper';

export const VALID_COURSE_STATUSES: CourseStatus[] = ['Active', 'Inactive'];

export const VALID_COURSE_SORT_FIELDS = [
  'id',
  'courseCode',
  'courseName',
  'level',
  'durationMonths',
  'tuitionFee',
  'status'
];

/**
 * Merges common management query params with course-specific query parameters
 */
export function buildCourseQueryParams(
  params: CourseFilterParams
): Record<string, string | number> {
  const query = buildManagementQueryParams(params);

  if (params.status && VALID_COURSE_STATUSES.includes(params.status)) {
    query.status = params.status;
  }

  if (params.level && params.level.trim().length > 0) {
    query.level = params.level.trim();
  }

  return query;
}

/**
 * Normalizes URL search parameters against whitelist to prevent invalid queries
 */
export function normalizeCourseQueryParams(searchParams: URLSearchParams): CourseFilterParams {
  const params: CourseFilterParams = {};

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
  const statusRaw = searchParams.get('status') as CourseStatus;
  if (statusRaw && VALID_COURSE_STATUSES.includes(statusRaw)) {
    params.status = statusRaw;
  }

  // Level
  const levelRaw = searchParams.get('level');
  if (levelRaw && levelRaw.trim().length > 0) {
    params.level = levelRaw.trim();
  }

  // SortBy
  const sortByRaw = searchParams.get('sortBy');
  if (sortByRaw && VALID_COURSE_SORT_FIELDS.includes(sortByRaw)) {
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
export function getCourseBasePath(pathname: string): string {
  if (pathname.startsWith('/staff')) {
    return '/staff/courses';
  }
  return '/admin/courses';
}

/**
 * Formats a currency amount to Vietnamese Currency format (e.g. 1.500.000 ₫)
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === '') {
    return '0 ₫';
  }

  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(num);
}

/**
 * Formats duration in months for display (e.g. 6 tháng)
 */
export function formatDurationMonths(months: number | null | undefined): string {
  if (months === null || months === undefined || isNaN(months)) {
    return '-';
  }
  return `${months} tháng`;
}

/**
 * Strictly validates raw string representation of tuition fee:
 * - Rejects commas or thousand separators
 * - Rejects negative values, scientific notation, text
 * - Accepts 0, 0.00, non-negative decimals with max 2 decimal places
 * - Integer part max 16 digits (fitting decimal(18,2))
 */
export function validateTuitionFee(val: string): { isValid: boolean; error?: string } {
  const trimmed = val.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Học phí là bắt buộc.' };
  }

  if (trimmed.includes(',') || trimmed.includes(' ')) {
    return {
      isValid: false,
      error: 'Vui lòng không nhập dấu phẩy hoặc khoảng trắng phân cách hàng nghìn (ví dụ nhập: 1500000 hoặc 1500000.50).'
    };
  }

  // Match non-negative decimal with max 2 decimal places
  const decimalPattern = /^\d+(\.\d{1,2})?$/;
  if (!decimalPattern.test(trimmed)) {
    return {
      isValid: false,
      error: 'Học phí không hợp lệ (phải là số không âm, tối đa 2 chữ số thập phân, không dùng ký hiệu e).'
    };
  }

  const parts = trimmed.split('.');
  const integerPart = parts[0].replace(/^0+/, ''); // strip leading zeros
  if (integerPart.length > 16) {
    return {
      isValid: false,
      error: 'Học phí vượt quá giới hạn tối đa của hệ thống (tối đa 16 chữ số nguyên).'
    };
  }

  return { isValid: true };
}

/**
 * Strictly parses and validates duration in months:
 * - Rejects empty strings (distinguished from 0)
 * - Rejects 0 or negative numbers
 * - Rejects non-integer numbers (decimals)
 */
export function validateDurationMonths(val: string): { isValid: boolean; value?: number; error?: string } {
  const trimmed = val.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Thời lượng khóa học là bắt buộc.' };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Thời lượng khóa học phải là số nguyên dương (không nhập số thập phân).' };
  }

  const num = parseInt(trimmed, 10);
  if (num <= 0) {
    return { isValid: false, error: 'Thời lượng khóa học phải lớn hơn 0 tháng.' };
  }

  return { isValid: true, value: num };
}

/**
 * Extracts human-readable error message from Axios API error
 */
export function getCourseApiErrorMessage(error: unknown): string {
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
      return 'Không tìm thấy thông tin khóa học. (404 Not Found)';
    }

    if (status === 409) {
      if (data && typeof data === 'object') {
        const d = data as { message?: string };
        if (d.message && d.message.trim().length > 0) {
          return d.message;
        }
      }
      return 'Mã khóa học đã tồn tại trong hệ thống. Vui lòng chọn mã khác.';
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
