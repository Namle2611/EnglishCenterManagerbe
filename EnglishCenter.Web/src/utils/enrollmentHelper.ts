import axios from 'axios';
import type { EnrollmentFilterParams, EnrollmentStatus } from '../types/enrollment.types';
import { buildManagementQueryParams } from './queryHelper';

export const VALID_ENROLLMENT_SORT_FIELDS = [
  'id',
  'studentcode',
  'studentname',
  'coursename',
  'classcode',
  'enrollmentdate',
  'tuitionamount',
  'status'
];

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã xác nhận',
  Paid: 'Đã đóng tiền',
  Enrolled: 'Đã vào lớp',
  Cancelled: 'Đã hủy'
};

export const ENROLLMENT_PAGE_SIZES = [10, 20, 50] as const;

/**
 * Deterministically resolves route base path with strict namespace validation.
 * Throws an error if prefix is outside /admin/enrollments or /staff/enrollments.
 */
export function getEnrollmentBasePath(pathname: string): string {
  if (
    pathname === '/admin/enrollments' ||
    pathname.startsWith('/admin/enrollments/')
  ) {
    return '/admin/enrollments';
  }

  if (
    pathname === '/staff/enrollments' ||
    pathname.startsWith('/staff/enrollments/')
  ) {
    return '/staff/enrollments';
  }

  throw new Error(`Invalid Enrollment route prefix: ${pathname}`);
}

/**
 * Validates whether a date string is an actual valid Gregorian calendar date (YYYY-MM-DD).
 * Rejects invalid strings such as "2026-99-99" or "2026-02-31".
 */
export function isValidCalendarDate(dateStr: string | null | undefined): boolean {
  if (!dateStr || typeof dateStr !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;

  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/**
 * Normalizes URL search parameters according to Phase 8B contract.
 */
export function normalizeEnrollmentQueryParams(searchParams: URLSearchParams): EnrollmentFilterParams {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const rawStudentId = parseInt(searchParams.get('studentId') || '', 10);
  const rawCourseId = parseInt(searchParams.get('courseId') || '', 10);
  const rawClassId = parseInt(searchParams.get('classId') || '', 10);
  const rawStatus = searchParams.get('status') as EnrollmentStatus | null;
  const rawDateFrom = searchParams.get('dateFrom') || undefined;
  const rawDateTo = searchParams.get('dateTo') || undefined;
  const rawSortBy = searchParams.get('sortBy')?.toLowerCase() || undefined;
  const rawSortDir = searchParams.get('sortDirection')?.toLowerCase() || undefined;

  const validSortBy = VALID_ENROLLMENT_SORT_FIELDS.includes(rawSortBy || '') ? rawSortBy : undefined;
  const validSortDir = validSortBy ? (rawSortDir === 'desc' ? 'desc' : 'asc') : undefined;

  const dateFrom = rawDateFrom && isValidCalendarDate(rawDateFrom) ? rawDateFrom : undefined;
  const dateTo = rawDateTo && isValidCalendarDate(rawDateTo) ? rawDateTo : undefined;

  return {
    page: !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1,
    pageSize: ENROLLMENT_PAGE_SIZES.includes(rawPageSize as (typeof ENROLLMENT_PAGE_SIZES)[number])
      ? rawPageSize
      : 10,
    search: searchParams.get('search')?.trim() || undefined,
    studentId: !isNaN(rawStudentId) && rawStudentId > 0 ? rawStudentId : undefined,
    courseId: !isNaN(rawCourseId) && rawCourseId > 0 ? rawCourseId : undefined,
    classId: !isNaN(rawClassId) && rawClassId > 0 ? rawClassId : undefined,
    status: ['Pending', 'Confirmed', 'Paid', 'Enrolled', 'Cancelled'].includes(rawStatus || '')
      ? rawStatus!
      : undefined,
    dateFrom,
    dateTo,
    sortBy: validSortBy,
    sortDirection: validSortDir
  };
}

/**
 * Builds Axios params dictionary from normalized EnrollmentFilterParams.
 */
export function buildEnrollmentQueryParams(params: EnrollmentFilterParams): Record<string, string | number> {
  const base = buildManagementQueryParams(params);

  if (params.studentId && params.studentId > 0) {
    base.studentId = params.studentId;
  }

  if (params.courseId && params.courseId > 0) {
    base.courseId = params.courseId;
  }

  if (params.classId && params.classId > 0) {
    base.classId = params.classId;
  }

  if (params.status) {
    base.status = params.status;
  }

  if (params.dateFrom) {
    base.dateFrom = params.dateFrom;
  }

  if (params.dateTo) {
    base.dateTo = params.dateTo;
  }

  return base;
}

/**
 * Parses an ISO date string into wall-clock display format "DD/MM/YYYY".
 * Strictly uses regex extraction to avoid timezone day drift.
 */
export function formatCalendarDate(dateStr: string | null | undefined): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return '-';
  }

  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return dateStr;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}

/**
 * Formats an audit timestamp into readable local date-time ("DD/MM/YYYY HH:mm").
 */
export function formatAuditDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dateStr;
  }
}

/**
 * Formats a decimal/number as Vietnamese currency (e.g. "4.500.000 ₫").
 */
export function formatVndCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

export const formatVND = formatVndCurrency;

/**
 * Safely extracts human-readable error messages from Axios / ProblemDetails responses.
 */
export function getEnrollmentApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data;
    if (data) {
      if (typeof data === 'string') return data;
      if (typeof data.message === 'string' && data.message.trim().length > 0) {
        return data.message;
      }
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        return data.errors.join('\n');
      }
      if (typeof data.errors === 'object' && data.errors !== null) {
        const errorList = Object.values(data.errors).flat();
        if (errorList.length > 0) {
          return errorList.join('\n');
        }
      }
      if (typeof data.title === 'string') {
        return data.title;
      }
    }
    if (err.response?.status === 404) return 'Không tìm thấy thông tin ghi danh.';
    if (err.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (err.response?.status === 409) return 'Xung đột dữ liệu hoặc lớp học đã đạt sĩ số tối đa.';
    if (err.response?.status === 400) return 'Dữ liệu yêu cầu không hợp lệ hoặc vi phạm quy trình ghi danh.';
    if (err.message) return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Đã xảy ra lỗi không xác định khi xử lý ghi danh.';
}
