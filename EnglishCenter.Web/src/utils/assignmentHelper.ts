import type { AssignmentStatus, ClassStatus, ClassStudentStatus } from '../types/assignment.types';

/**
 * Converts a backend UTC ISO string into a local 'YYYY-MM-DDTHH:mm' string
 * suitable for <input type="datetime-local">.
 */
export function utcToLocalInput(utcIsoString: string | null | undefined): string {
  if (!utcIsoString) return '';
  const date = new Date(utcIsoString);
  if (isNaN(date.getTime())) return '';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * Converts a local datetime-local string (e.g. '2026-10-15T22:00') into
 * a full UTC ISO string with explicit 'Z' timezone (e.g. '2026-10-15T15:00:00.000Z').
 */
export function localInputToUtc(localString: string | null | undefined): string {
  if (!localString || !localString.trim()) return '';
  const date = new Date(localString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString();
}

/**
 * Formats an ISO datetime string into Vietnamese local display format: DD/MM/YYYY HH:mm
 */
export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return '—';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Checks whether a deadline timestamp is strictly in the past compared to now.
 */
export function isPastDeadline(deadlineIso: string): boolean {
  const d = new Date(deadlineIso);
  if (isNaN(d.getTime())) return false;
  return d.getTime() < Date.now();
}

export interface DeadlineBadgeInfo {
  label: string;
  variant: 'danger' | 'warning' | 'info';
  isPast: boolean;
}

/**
 * Derives presentation badge info from a deadline ISO string.
 */
export function getDeadlineBadgeInfo(deadlineIso: string): DeadlineBadgeInfo {
  const d = new Date(deadlineIso);
  if (isNaN(d.getTime())) {
    return { label: 'Không xác định', variant: 'info', isPast: false };
  }

  const now = Date.now();
  const diffMs = d.getTime() - now;

  if (diffMs < 0) {
    return { label: 'Đã quá hạn', variant: 'danger', isPast: true };
  }
  // Less than 24 hours remaining
  if (diffMs <= 24 * 60 * 60 * 1000) {
    return { label: 'Sắp hết hạn', variant: 'warning', isPast: false };
  }

  return { label: 'Sắp tới', variant: 'info', isPast: false };
}

/**
 * Vietnamese label mappings
 */
export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  Draft: 'Bản nháp',
  Published: 'Đang mở',
  Closed: 'Đã đóng'
};

export const CLASS_STATUS_LABELS: Record<ClassStatus, string> = {
  Planned: 'Dự kiến',
  Ongoing: 'Đang diễn ra',
  Completed: 'Đã kết thúc',
  Cancelled: 'Đã hủy'
};

export const MEMBERSHIP_STATUS_LABELS: Record<ClassStudentStatus, string> = {
  Active: 'Đang học',
  Completed: 'Đã hoàn thành',
  Withdrawn: 'Đã rút lui'
};

export const TEACHER_SNAPSHOT_DETAIL_LABEL = 'Giảng viên được phân công khi tạo bài tập';
export const TEACHER_SNAPSHOT_COMPACT_LABEL = 'GV khi tạo bài';
export const TEACHER_SNAPSHOT_TOOLTIP = 'Giảng viên được phân công tại thời điểm tạo bài tập (snapshot)';

/**
 * Validates whether a string is a valid absolute HTTP/HTTPS URL with <= 500 characters.
 * Returns null if blank or whitespace. Throws or returns boolean.
 */
export function isValidHttpUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true; // empty is allowed when optional
  const trimmed = url.trim();
  if (trimmed.length > 500) return false;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Normalizes an optional URL or text: blank or whitespace-only becomes null, otherwise trimmed.
 */
export function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Checks if status transition is allowed
 */
export function canTransitionStatus(
  from: AssignmentStatus,
  to: AssignmentStatus,
  submissionCount: number
): { allowed: boolean; reason?: string } {
  if (from === to) return { allowed: true };

  if (from === 'Closed' && to === 'Draft') {
    return { allowed: false, reason: 'Không thể chuyển từ Đã đóng về Bản nháp.' };
  }

  if (from === 'Published' && to === 'Draft') {
    if (submissionCount > 0) {
      return { allowed: false, reason: 'Không thể chuyển về Bản nháp vì đã có bài nộp.' };
    }
  }

  return { allowed: true };
}

/**
 * Evaluates whether a student can submit for the first time.
 */
export function canStudentSubmit(
  membershipStatus: ClassStudentStatus | null,
  classStatus: ClassStatus,
  assignmentStatus: AssignmentStatus,
  hasExistingSubmission: boolean
): boolean {
  if (membershipStatus !== 'Active') return false;
  if (classStatus !== 'Planned' && classStatus !== 'Ongoing') return false;
  if (assignmentStatus !== 'Published') return false;
  return !hasExistingSubmission;
}

/**
 * Evaluates whether a student can resubmit.
 */
export function canStudentResubmit(
  membershipStatus: ClassStudentStatus | null,
  classStatus: ClassStatus,
  assignmentStatus: AssignmentStatus,
  hasExistingSubmission: boolean,
  isGraded: boolean,
  score: number | null
): boolean {
  if (membershipStatus !== 'Active') return false;
  if (classStatus !== 'Planned' && classStatus !== 'Ongoing') return false;
  if (assignmentStatus !== 'Published') return false;
  if (!hasExistingSubmission) return false;
  if (isGraded) return false;
  return score === null;
}
