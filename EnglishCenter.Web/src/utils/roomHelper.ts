import axios from 'axios';
import type { RoomFilterParams, RoomStatus } from '../types/room.types';
import { buildManagementQueryParams } from './queryHelper';

export const VALID_ROOM_STATUSES: RoomStatus[] = ['Active', 'Inactive', 'Maintenance'];

export const VALID_ROOM_SORT_FIELDS = [
  'id',
  'roomCode',
  'roomName',
  'capacity',
  'status'
];

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  Active: 'Đang hoạt động',
  Inactive: 'Ngừng hoạt động',
  Maintenance: 'Đang bảo trì'
};

/**
 * Deterministically resolves route base path with strict prefix validation
 * Throws an error if prefix is outside /admin or /staff namespace
 */
export function getRoomBasePath(pathname: string): string {
  if (pathname.startsWith('/admin/') || pathname === '/admin/rooms') {
    return '/admin/rooms';
  }
  if (pathname.startsWith('/staff/') || pathname === '/staff/rooms') {
    return '/staff/rooms';
  }
  throw new Error(`Invalid Room Management route prefix: ${pathname}`);
}

/**
 * Normalizes an optional RoomName string:
 * Trims whitespace; returns null if empty or undefined/null
 */
export function normalizeOptionalRoomName(val: string | null | undefined): string | null {
  if (!val) return null;
  const trimmed = val.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validates RoomCode input
 */
export function validateRoomCode(val: string): { isValid: boolean; error?: string } {
  const trimmed = val.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Mã phòng học là bắt buộc.' };
  }

  if (trimmed.length > 30) {
    return { isValid: false, error: 'Mã phòng học không được vượt quá 30 ký tự.' };
  }

  return { isValid: true };
}

/**
 * Validates RoomName on a normalized value (or string)
 */
export function validateRoomName(val: string | null): { isValid: boolean; error?: string } {
  if (val !== null && val.length > 100) {
    return { isValid: false, error: 'Tên phòng học không được vượt quá 100 ký tự.' };
  }
  return { isValid: true };
}

/**
 * Validates Capacity string input:
 * Must be a positive integer (> 0). Strictly avoids Number("") === 0 bug.
 */
export function validateCapacity(val: string): { isValid: boolean; value?: number; error?: string } {
  const trimmed = val.trim();

  if (trimmed.length === 0) {
    return { isValid: false, error: 'Sức chứa phòng học là bắt buộc.' };
  }

  if (!/^-?\d+$/.test(trimmed)) {
    return { isValid: false, error: 'Sức chứa phải là số nguyên dương (không nhập số thập phân).' };
  }

  const num = parseInt(trimmed, 10);
  if (num <= 0) {
    return { isValid: false, error: 'Sức chứa phải lớn hơn 0.' };
  }

  return { isValid: true, value: num };
}

/**
 * Merges common management query params with room-specific parameters
 */
export function buildRoomQueryParams(
  params: RoomFilterParams
): Record<string, string | number> {
  const query = buildManagementQueryParams(params);

  if (params.status && VALID_ROOM_STATUSES.includes(params.status)) {
    query.status = params.status;
  }

  return query;
}

/**
 * Normalizes URL search parameters against strict whitelist rules
 */
export function normalizeRoomQueryParams(searchParams: URLSearchParams): RoomFilterParams {
  const params: RoomFilterParams = {};

  // Page: must be integer >= 1
  const pageRaw = parseInt(searchParams.get('page') || '1', 10);
  params.page = !isNaN(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  // PageSize: must be in [10, 20, 50]
  const pageSizeRaw = parseInt(searchParams.get('pageSize') || '10', 10);
  params.pageSize = [10, 20, 50].includes(pageSizeRaw) ? pageSizeRaw : 10;

  // Search: trimmed, if empty -> undefined
  const searchRaw = searchParams.get('search');
  if (searchRaw && searchRaw.trim().length > 0) {
    params.search = searchRaw.trim();
  }

  // Status: must be valid RoomStatus
  const statusRaw = searchParams.get('status') as RoomStatus;
  if (statusRaw && VALID_ROOM_STATUSES.includes(statusRaw)) {
    params.status = statusRaw;
  }

  // SortBy: must be in whitelist, default 'id'
  const sortByRaw = searchParams.get('sortBy');
  if (sortByRaw && VALID_ROOM_SORT_FIELDS.includes(sortByRaw)) {
    params.sortBy = sortByRaw;
  } else {
    params.sortBy = 'id';
  }

  // SortDirection: must be 'asc' or 'desc', default 'desc'
  const sortDirRaw = searchParams.get('sortDirection');
  if (sortDirRaw === 'asc' || sortDirRaw === 'desc') {
    params.sortDirection = sortDirRaw;
  } else {
    params.sortDirection = 'desc';
  }

  return params;
}

/**
 * Extracts human-readable error message from Axios API error
 */
export function getRoomApiErrorMessage(error: unknown): string {
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
      return 'Không tìm thấy thông tin phòng học. (404 Not Found)';
    }

    if (status === 409) {
      if (data && typeof data === 'object') {
        const d = data as { message?: string };
        if (d.message && d.message.trim().length > 0) {
          return d.message;
        }
      }
      return 'Mã phòng học đã tồn tại trong hệ thống. Vui lòng chọn mã khác.';
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
