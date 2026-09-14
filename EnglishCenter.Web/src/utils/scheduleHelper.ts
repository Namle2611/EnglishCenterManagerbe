import axios from 'axios';
import type { ScheduleFilterParams } from '../types/schedule.types';
import { buildManagementQueryParams } from './queryHelper';

export const DAY_OF_WEEK_OPTIONS: Array<{ value: number; label: string; shortLabel: string }> = [
  { value: 1, label: 'Thứ Hai', shortLabel: 'T2' },
  { value: 2, label: 'Thứ Ba', shortLabel: 'T3' },
  { value: 3, label: 'Thứ Tư', shortLabel: 'T4' },
  { value: 4, label: 'Thứ Năm', shortLabel: 'T5' },
  { value: 5, label: 'Thứ Sáu', shortLabel: 'T6' },
  { value: 6, label: 'Thứ Bảy', shortLabel: 'T7' },
  { value: 7, label: 'Chủ Nhật', shortLabel: 'CN' }
];

export const DAY_OF_WEEK_LABELS: Record<number, string> = {
  1: 'Thứ Hai',
  2: 'Thứ Ba',
  3: 'Thứ Tư',
  4: 'Thứ Năm',
  5: 'Thứ Sáu',
  6: 'Thứ Bảy',
  7: 'Chủ Nhật'
};

export const VALID_SCHEDULE_SORT_FIELDS = [
  'id',
  'classcode',
  'roomcode',
  'dayofweek',
  'starttime',
  'endtime'
];

/**
 * Deterministically resolves route base path with strict namespace validation.
 * Throws an error if prefix is outside /admin/schedules or /staff/schedules.
 */
export function getScheduleBasePath(pathname: string): string {
  if (
    pathname === '/admin/schedules' ||
    pathname.startsWith('/admin/schedules/')
  ) {
    return '/admin/schedules';
  }

  if (
    pathname === '/staff/schedules' ||
    pathname.startsWith('/staff/schedules/')
  ) {
    return '/staff/schedules';
  }

  throw new Error(`Invalid Schedule Management route prefix: ${pathname}`);
}

/**
 * Converts API TimeSpan string ("18:00:00") to HTML input format ("18:00").
 * Zero Date/timezone overhead.
 */
export function formatTimeForInput(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (trimmed.length >= 5) {
    return trimmed.substring(0, 5);
  }
  return trimmed;
}

/**
 * Converts HTML input time ("18:00") to API TimeSpan payload wire format ("18:00:00").
 */
export function formatTimeForPayload(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  if (trimmed.length === 5) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

/**
 * Formats time range for display (e.g. "18:00 – 20:00").
 */
export function formatTimeRange(startTime: string | null | undefined, endTime: string | null | undefined): string {
  if (!startTime || !endTime) return '-';
  return `${formatTimeForInput(startTime)} – ${formatTimeForInput(endTime)}`;
}

/**
 * Parses an ISO wall-clock string (e.g. "2026-10-01T00:00:00") into display format "01/10/2026".
 * Strictly avoids using new Date() to prevent GMT/timezone offset conversions.
 */
export function formatClassDate(dateStr: string | null | undefined): string {
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
 * Merges management query parameters with schedule-specific filters.
 */
export function buildScheduleQueryParams(
  params: ScheduleFilterParams
): Record<string, string | number> {
  const query = buildManagementQueryParams(params);

  if (params.classId && params.classId > 0) {
    query.classId = params.classId;
  }

  if (params.roomId && params.roomId > 0) {
    query.roomId = params.roomId;
  }

  if (params.teacherId && params.teacherId > 0) {
    query.teacherId = params.teacherId;
  }

  if (params.dayOfWeek && params.dayOfWeek >= 1 && params.dayOfWeek <= 7) {
    query.dayOfWeek = params.dayOfWeek;
  }

  return query;
}

/**
 * Normalizes URL search parameters against strict whitelist rules.
 * Does NOT inject a default sortBy, preserving the backend's natural weekly order
 * (DayOfWeek ASC, Then StartTime ASC) when no sort is specified.
 */
export function normalizeScheduleQueryParams(searchParams: URLSearchParams): ScheduleFilterParams {
  const params: ScheduleFilterParams = {};

  // Page: must be integer >= 1
  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  params.page = !isNaN(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  // PageSize: must be in [10, 20, 50]
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '10', 10);
  params.pageSize = [10, 20, 50].includes(pageSizeRaw) ? pageSizeRaw : 10;

  // Search: trimmed, if empty -> omit
  const searchRaw = searchParams.get('search');
  if (searchRaw && searchRaw.trim().length > 0) {
    params.search = searchRaw.trim();
  }

  // ClassId: must be integer > 0; if <= 0 or NaN -> omit
  const classIdRaw = parseInt(searchParams.get('classId') || '', 10);
  if (!isNaN(classIdRaw) && classIdRaw > 0) {
    params.classId = classIdRaw;
  }

  // RoomId: must be integer > 0; if <= 0 or NaN -> omit
  const roomIdRaw = parseInt(searchParams.get('roomId') || '', 10);
  if (!isNaN(roomIdRaw) && roomIdRaw > 0) {
    params.roomId = roomIdRaw;
  }

  // TeacherId: must be integer > 0; if <= 0 or NaN -> omit
  const teacherIdRaw = parseInt(searchParams.get('teacherId') || '', 10);
  if (!isNaN(teacherIdRaw) && teacherIdRaw > 0) {
    params.teacherId = teacherIdRaw;
  }

  // DayOfWeek: must be 1..7; if outside -> omit
  const dayRaw = parseInt(searchParams.get('dayOfWeek') || '', 10);
  if (!isNaN(dayRaw) && dayRaw >= 1 && dayRaw <= 7) {
    params.dayOfWeek = dayRaw;
  }

  // SortBy: must be in whitelist; if absent/invalid -> omit
  const sortByRaw = searchParams.get('sortBy');
  if (sortByRaw && VALID_SCHEDULE_SORT_FIELDS.includes(sortByRaw.toLowerCase())) {
    params.sortBy = sortByRaw.toLowerCase();
    const sortDirRaw = searchParams.get('sortDirection')?.toLowerCase();
    params.sortDirection = (sortDirRaw === 'asc' || sortDirRaw === 'desc') ? sortDirRaw : 'asc';
  }

  return params;
}

/**
 * Extracts human-readable error message from Axios API error.
 */
export function getScheduleApiErrorMessage(error: unknown): string {
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
      return 'Không tìm thấy thông tin lịch học. (404 Not Found)';
    }

    if (status === 409) {
      if (data && typeof data === 'object') {
        const d = data as { message?: string };
        if (d.message && d.message.trim().length > 0) {
          return d.message;
        }
      }
      return 'Khung giờ học bị xung đột lịch phòng, lớp học hoặc giáo viên.';
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
