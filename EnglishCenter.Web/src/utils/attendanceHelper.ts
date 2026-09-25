import type {
  AttendanceQueryParams,
  AttendanceStatus,
  ClassStatus,
  ClassStudentStatus
} from '../types/attendance.types';

export const ATTENDANCE_STATUS_OPTIONS: { value: AttendanceStatus; label: string }[] = [
  { value: 'Present', label: 'Có mặt' },
  { value: 'Absent', label: 'Vắng mặt' },
  { value: 'Late', label: 'Đi muộn' },
  { value: 'Excused', label: 'Có phép' }
];

export const VALID_PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

export const ATTENDANCE_SORT_FIELDS = [
  'id',
  'sessiondate',
  'starttime',
  'studentcode',
  'studentname',
  'classcode',
  'status'
] as const;

export function getAttendanceBasePath(pathname: string): string {
  if (pathname.startsWith('/admin')) {
    return '/admin/attendances';
  }
  if (pathname.startsWith('/staff')) {
    return '/staff/attendances';
  }
  if (pathname.startsWith('/teacher')) {
    return '/teacher/attendances';
  }
  return '/admin/attendances';
}

export function getAttendanceStatusLabel(status: AttendanceStatus | null | undefined): string {
  switch (status) {
    case 'Present':
      return 'Có mặt';
    case 'Absent':
      return 'Vắng mặt';
    case 'Late':
      return 'Đi muộn';
    case 'Excused':
      return 'Có phép';
    default:
      return 'Chưa điểm danh';
  }
}

export function getAttendanceStatusBadgeClass(status: AttendanceStatus | null | undefined): string {
  switch (status) {
    case 'Present':
      return 'badge-success';
    case 'Absent':
      return 'badge-danger';
    case 'Late':
      return 'badge-warning';
    case 'Excused':
      return 'badge-info';
    default:
      return 'badge-neutral';
  }
}

export function getClassStudentStatusLabel(status: ClassStudentStatus): string {
  switch (status) {
    case 'Active':
      return 'Đang học';
    case 'Completed':
      return 'Hoàn thành';
    case 'Withdrawn':
      return 'Đã rút lui';
    default:
      return status;
  }
}

export function getClassStatusLabel(status: ClassStatus): string {
  switch (status) {
    case 'Planned':
      return 'Dự kiến';
    case 'Ongoing':
      return 'Đang diễn ra';
    case 'Completed':
      return 'Hoàn thành';
    case 'Cancelled':
      return 'Đã hủy';
    default:
      return status;
  }
}

export function getDayOfWeekLabel(dayOfWeek: number): string {
  switch (dayOfWeek) {
    case 1:
      return 'Thứ Hai';
    case 2:
      return 'Thứ Ba';
    case 3:
      return 'Thứ Tư';
    case 4:
      return 'Thứ Năm';
    case 5:
      return 'Thứ Sáu';
    case 6:
      return 'Thứ Bảy';
    case 7:
      return 'Chủ Nhật';
    default:
      return `Thứ ${dayOfWeek}`;
  }
}

export function formatAttendanceDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  // Match YYYY-MM-DD without converting to Date / UTC drift
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

export function toWireTime(timeStr: string): string {
  if (!timeStr) return '00:00:00';
  const trimmed = timeStr.trim();
  const parts = trimmed.split(':');
  if (parts.length === 2) {
    return `${trimmed}:00`;
  }
  if (parts.length === 3) {
    return trimmed;
  }
  return trimmed;
}

export function toDisplayTime(timeStr: string | null | undefined): string {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return trimmed;
}

export function isValidCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

export function normalizeAttendanceQueryParams(searchParams: URLSearchParams): AttendanceQueryParams {
  const params: AttendanceQueryParams = {};

  // Page
  const pageRaw = searchParams.get('page');
  if (pageRaw) {
    const p = parseInt(pageRaw, 10);
    if (!isNaN(p) && p >= 1) {
      params.page = p;
    }
  }

  // PageSize
  const pageSizeRaw = searchParams.get('pageSize');
  if (pageSizeRaw) {
    const ps = parseInt(pageSizeRaw, 10);
    if (VALID_PAGE_SIZES.includes(ps as typeof VALID_PAGE_SIZES[number])) {
      params.pageSize = ps;
    }
  }

  // Search
  const search = searchParams.get('search')?.trim();
  if (search) {
    params.search = search;
  }

  // IDs
  const classIdRaw = searchParams.get('classId');
  if (classIdRaw) {
    const cid = parseInt(classIdRaw, 10);
    if (!isNaN(cid) && cid > 0) {
      params.classId = cid;
    }
  }

  const studentIdRaw = searchParams.get('studentId');
  if (studentIdRaw) {
    const sid = parseInt(studentIdRaw, 10);
    if (!isNaN(sid) && sid > 0) {
      params.studentId = sid;
    }
  }

  const courseIdRaw = searchParams.get('courseId');
  if (courseIdRaw) {
    const crsId = parseInt(courseIdRaw, 10);
    if (!isNaN(crsId) && crsId > 0) {
      params.courseId = crsId;
    }
  }

  const teacherIdRaw = searchParams.get('teacherId');
  if (teacherIdRaw) {
    const tid = parseInt(teacherIdRaw, 10);
    if (!isNaN(tid) && tid > 0) {
      params.teacherId = tid;
    }
  }

  // Status
  const statusRaw = searchParams.get('status')?.trim();
  if (statusRaw && ['Present', 'Absent', 'Late', 'Excused'].includes(statusRaw)) {
    params.status = statusRaw as AttendanceStatus;
  }

  // Date range
  const dateFromRaw = searchParams.get('dateFrom')?.trim();
  if (dateFromRaw && isValidCalendarDate(dateFromRaw)) {
    params.dateFrom = dateFromRaw;
  }

  const dateToRaw = searchParams.get('dateTo')?.trim();
  if (dateToRaw && isValidCalendarDate(dateToRaw)) {
    params.dateTo = dateToRaw;
  }

  // Ensure dateFrom <= dateTo if both provided
  if (params.dateFrom && params.dateTo && params.dateFrom > params.dateTo) {
    // Invalidate invalid range
    params.dateFrom = undefined;
    params.dateTo = undefined;
  }

  // Sort dependency: if sortBy is omitted or invalid, omit both sortBy and sortDirection
  const sortByRaw = searchParams.get('sortBy')?.trim().toLowerCase();
  if (sortByRaw && ATTENDANCE_SORT_FIELDS.includes(sortByRaw as typeof ATTENDANCE_SORT_FIELDS[number])) {
    params.sortBy = sortByRaw;
    const sortDirectionRaw = searchParams.get('sortDirection')?.trim().toLowerCase();
    if (sortDirectionRaw === 'asc' || sortDirectionRaw === 'desc') {
      params.sortDirection = sortDirectionRaw;
    }
  }

  return params;
}

export function buildAttendanceQueryParams(params: AttendanceQueryParams): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  if (params.page && params.page >= 1) {
    result.page = params.page;
  }

  if (params.pageSize && params.pageSize >= 1) {
    result.pageSize = params.pageSize;
  }

  if (params.search && params.search.trim().length > 0) {
    result.search = params.search.trim();
  }

  if (params.classId && params.classId > 0) {
    result.classId = params.classId;
  }

  if (params.studentId && params.studentId > 0) {
    result.studentId = params.studentId;
  }

  if (params.courseId && params.courseId > 0) {
    result.courseId = params.courseId;
  }

  if (params.teacherId && params.teacherId > 0) {
    result.teacherId = params.teacherId;
  }

  if (params.status) {
    result.status = params.status;
  }

  if (params.dateFrom) {
    result.dateFrom = params.dateFrom;
  }

  if (params.dateTo) {
    result.dateTo = params.dateTo;
  }

  if (params.sortBy) {
    result.sortBy = params.sortBy;
    if (params.sortDirection) {
      result.sortDirection = params.sortDirection;
    }
  }

  return result;
}

export function extractAttendanceErrorMessage(err: unknown): string {
  if (!err) return 'Đã có lỗi không xác định xảy ra.';

  if (typeof err === 'string') return err;

  const errorObj = err as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        errors?: string[] | Record<string, string[]>;
        title?: string;
      };
    };
    message?: string;
  };

  const responseData = errorObj.response?.data;
  if (responseData) {
    if (responseData.message) {
      return responseData.message;
    }

    if (Array.isArray(responseData.errors) && responseData.errors.length > 0) {
      return responseData.errors.join('. ');
    }

    if (responseData.errors && typeof responseData.errors === 'object') {
      const errorEntries = Object.values(responseData.errors).flat();
      if (errorEntries.length > 0) {
        return errorEntries.join('. ');
      }
    }

    if (responseData.title) {
      return responseData.title;
    }
  }

  if (errorObj.message) {
    return errorObj.message;
  }

  return 'Đã có lỗi xảy ra khi thực hiện yêu cầu.';
}
