import axios from 'axios';
import type { PaymentFilterParams, PaymentMethod, PaymentStatus } from '../types/payment.types';
import { buildManagementQueryParams } from './queryHelper';

export const VALID_PAYMENT_SORT_FIELDS = [
  'id',
  'paymentdate',
  'amount',
  'status',
  'paymentmethod',
  'studentcode',
  'studentname',
  'coursename',
  'transactioncode'
];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  Pending: 'Chờ xử lý',
  Completed: 'Hoàn tất',
  Failed: 'Thất bại',
  Cancelled: 'Đã hủy'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  Cash: 'Tiền mặt',
  BankTransfer: 'Chuyển khoản',
  Online: 'Trực tuyến'
};

export const PAYMENT_PAGE_SIZES = [10, 20, 50] as const;

/**
 * Deterministically resolves route base path with strict namespace validation.
 * Returns '/admin/payments' or '/staff/payments'.
 * Throws an error if prefix is outside approved namespaces.
 */
export function getPaymentBasePath(pathname: string): string {
  if (
    pathname === '/admin/payments' ||
    pathname.startsWith('/admin/payments/')
  ) {
    return '/admin/payments';
  }

  if (
    pathname === '/staff/payments' ||
    pathname.startsWith('/staff/payments/')
  ) {
    return '/staff/payments';
  }

  throw new Error(`Invalid Payment route prefix: ${pathname}`);
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
 * Converts a UTC ISO-8601 backend string to local wall-clock 'YYYY-MM-DDTHH:mm' for datetime-local inputs.
 * Returns empty string if timestamp is null or invalid.
 */
export function toLocalDatetimeLocalValue(isoString: string | null | undefined): string {
  if (!isoString) return '';
  // When backend returns UTC ISO string without trailing 'Z' (e.g. '2026-09-15T02:30:00'),
  // append 'Z' so JavaScript interprets it as UTC rather than local wall-clock.
  const utcNormalized = (isoString.includes('Z') || isoString.includes('+') || (isoString.includes('-') && isoString.length > 10 && isoString.lastIndexOf('-') > 10))
    ? isoString
    : `${isoString}Z`;
  const date = new Date(utcNormalized);
  if (isNaN(date.getTime())) return '';

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${hh}:${mm}`;
}

/**
 * Converts a local wall-clock 'YYYY-MM-DDTHH:mm' input value into a UTC ISO-8601 wire string.
 * Returns undefined if blank or invalid.
 */
export function toUtcIsoString(datetimeLocalValue: string | null | undefined): string | undefined {
  if (!datetimeLocalValue || !datetimeLocalValue.trim()) return undefined;
  const date = new Date(datetimeLocalValue);
  if (isNaN(date.getTime())) return undefined;
  return date.toISOString();
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
 * Formats an audit/timestamp into readable local date-time ("DD/MM/YYYY HH:mm").
 */
export function formatAuditDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const utcNormalized = (dateStr.includes('Z') || dateStr.includes('+') || (dateStr.includes('-') && dateStr.length > 10 && dateStr.lastIndexOf('-') > 10))
      ? dateStr
      : `${dateStr}Z`;
    const d = new Date(utcNormalized);
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
 * Normalizes URL search parameters according to Phase 9B contract.
 * Defensive against malformed URLs.
 */
export function normalizePaymentQueryParams(searchParams: URLSearchParams): PaymentFilterParams {
  const rawPage = parseInt(searchParams.get('page') || '1', 10);
  const rawPageSize = parseInt(searchParams.get('pageSize') || '10', 10);
  const rawEnrollmentId = parseInt(searchParams.get('enrollmentId') || '', 10);
  const rawStudentId = parseInt(searchParams.get('studentId') || '', 10);
  const rawCourseId = parseInt(searchParams.get('courseId') || '', 10);
  const rawClassId = parseInt(searchParams.get('classId') || '', 10);
  const rawStatus = searchParams.get('status') as PaymentStatus | null;
  const rawPaymentMethod = searchParams.get('paymentMethod') as PaymentMethod | null;
  const rawDateFrom = searchParams.get('dateFrom') || undefined;
  const rawDateTo = searchParams.get('dateTo') || undefined;
  const rawMinAmount = searchParams.get('minAmount');
  const rawMaxAmount = searchParams.get('maxAmount');
  const rawSortBy = searchParams.get('sortBy')?.toLowerCase() || undefined;
  const rawSortDir = searchParams.get('sortDirection')?.toLowerCase() || undefined;

  // Sort dependency: invalid or absent sortBy -> omit both sortBy and sortDirection
  const validSortBy = VALID_PAYMENT_SORT_FIELDS.includes(rawSortBy || '') ? rawSortBy : undefined;
  const validSortDir = validSortBy ? (rawSortDir === 'desc' ? 'desc' : 'asc') : undefined;

  const dateFrom = rawDateFrom && isValidCalendarDate(rawDateFrom) ? rawDateFrom : undefined;
  const dateTo = rawDateTo && isValidCalendarDate(rawDateTo) ? rawDateTo : undefined;

  const parsedMinAmount = rawMinAmount !== null && rawMinAmount !== undefined && rawMinAmount !== '' ? Number(rawMinAmount) : undefined;
  const parsedMaxAmount = rawMaxAmount !== null && rawMaxAmount !== undefined && rawMaxAmount !== '' ? Number(rawMaxAmount) : undefined;

  const minAmount = parsedMinAmount !== undefined && !isNaN(parsedMinAmount) && parsedMinAmount >= 0 ? parsedMinAmount : undefined;
  const maxAmount = parsedMaxAmount !== undefined && !isNaN(parsedMaxAmount) && parsedMaxAmount >= 0 ? parsedMaxAmount : undefined;

  return {
    page: !isNaN(rawPage) && rawPage >= 1 ? rawPage : 1,
    pageSize: PAYMENT_PAGE_SIZES.includes(rawPageSize as (typeof PAYMENT_PAGE_SIZES)[number])
      ? rawPageSize
      : 10,
    search: searchParams.get('search')?.trim() || undefined,
    enrollmentId: !isNaN(rawEnrollmentId) && rawEnrollmentId > 0 ? rawEnrollmentId : undefined,
    studentId: !isNaN(rawStudentId) && rawStudentId > 0 ? rawStudentId : undefined,
    courseId: !isNaN(rawCourseId) && rawCourseId > 0 ? rawCourseId : undefined,
    classId: !isNaN(rawClassId) && rawClassId > 0 ? rawClassId : undefined,
    status: ['Pending', 'Completed', 'Failed', 'Cancelled'].includes(rawStatus || '')
      ? rawStatus!
      : undefined,
    paymentMethod: ['Cash', 'BankTransfer', 'Online'].includes(rawPaymentMethod || '')
      ? rawPaymentMethod!
      : undefined,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    sortBy: validSortBy,
    sortDirection: validSortDir
  };
}

/**
 * Builds Axios params dictionary from normalized PaymentFilterParams.
 */
export function buildPaymentQueryParams(params: PaymentFilterParams): Record<string, string | number> {
  const base = buildManagementQueryParams(params);

  if (params.enrollmentId && params.enrollmentId > 0) {
    base.enrollmentId = params.enrollmentId;
  }

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

  if (params.paymentMethod) {
    base.paymentMethod = params.paymentMethod;
  }

  if (params.dateFrom) {
    base.dateFrom = params.dateFrom;
  }

  if (params.dateTo) {
    base.dateTo = params.dateTo;
  }

  if (params.minAmount !== undefined && params.minAmount !== null && params.minAmount >= 0) {
    base.minAmount = params.minAmount;
  }

  if (params.maxAmount !== undefined && params.maxAmount !== null && params.maxAmount >= 0) {
    base.maxAmount = params.maxAmount;
  }

  return base;
}

/**
 * Safely extracts human-readable error messages from Axios / ProblemDetails responses.
 */
export function getPaymentApiErrorMessage(err: unknown): string {
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
    if (err.response?.status === 404) return 'Không tìm thấy thông tin thanh toán.';
    if (err.response?.status === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (err.response?.status === 409) return 'Xung đột dữ liệu hoặc mã giao dịch đã tồn tại trên hệ thống.';
    if (err.response?.status === 400) return 'Dữ liệu yêu cầu không hợp lệ hoặc vi phạm quy định tài chính.';
    if (err.message) return err.message;
  }

  if (err instanceof Error) {
    return err.message;
  }

  return 'Đã xảy ra lỗi không xác định khi xử lý thanh toán.';
}
