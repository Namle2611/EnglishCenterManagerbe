import type { ClassStudentStatus } from '../types/assignment.types';
import type {
  GradeItemResponse,
  GradeItemStatus,
  GradeQueryParams,
  GradeSubmissionPayload
} from '../types/grade.types';

export const GRADE_ITEM_STATUS_LABELS: Record<GradeItemStatus, string> = {
  Missing: 'Chưa nộp',
  InProgress: 'Đang làm',
  Ungraded: 'Chờ chấm',
  Graded: 'Đã có điểm',
  Locked: 'Chưa mở kết quả'
};

export const MEMBERSHIP_STATUS_LABELS: Record<ClassStudentStatus, string> = {
  Active: 'Đang học',
  Completed: 'Đã hoàn thành',
  Withdrawn: 'Đã rút lui'
};

export const GRADE_REPORTING_LABELS = {
  visibleGradedItemCount: 'Số mục đã có điểm',
  pendingItemCount: 'Chờ xử lý',
  visibleEarnedPoints: 'Điểm đạt được',
  visiblePossiblePoints: 'Tổng điểm có thể đạt của các mục đã có điểm',
  visiblePercentage: 'Tỷ lệ điểm hiện có'
} as const;

export const SORT_FIELDS_WHITELIST = ['studentcode', 'studentname', 'id'] as const;

/**
 * Maps GradeItemStatus to human-readable label.
 */
export function getGradeItemStatusLabel(status: GradeItemStatus): string {
  return GRADE_ITEM_STATUS_LABELS[status] || status;
}

/**
 * Maps ClassStudentStatus to human-readable label.
 */
export function getMembershipStatusLabel(status: ClassStudentStatus): string {
  return MEMBERSHIP_STATUS_LABELS[status] || status;
}

/**
 * Formats score respecting 0 vs null.
 * 0 is a valid numeric score and must be formatted as "0 / maxScore".
 * null/undefined indicates ungraded/missing/locked and returns "— / maxScore".
 */
export function formatScore(rawScore: number | null | undefined, maxScore: number): string {
  if (rawScore === null || rawScore === undefined) {
    return `— / ${maxScore}`;
  }
  return `${rawScore} / ${maxScore}`;
}

/**
 * Formats percentage respecting null vs 0.
 * null/undefined returns "—".
 * 0 returns "0%".
 */
export function formatPercentage(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) {
    return '—';
  }
  const rounded = Number.isInteger(percentage)
    ? percentage.toString()
    : (Math.round(percentage * 10) / 10).toFixed(1);
  return `${rounded}%`;
}

/**
 * Checks if a sort field is in the approved backend whitelist.
 */
export function isValidSortField(field: string | undefined | null): boolean {
  if (!field) return false;
  const normalized = field.trim().toLowerCase();
  return (SORT_FIELDS_WHITELIST as readonly string[]).includes(normalized);
}

/**
 * Validates a grading score input.
 * Score must be numeric, >= 0, and <= maxScore.
 */
export function validateScore(score: unknown, maxScore: number): { isValid: boolean; error?: string } {
  if (score === null || score === undefined || score === '') {
    return { isValid: false, error: 'Vui lòng nhập điểm số.' };
  }
  const numericScore = Number(score);
  if (Number.isNaN(numericScore)) {
    return { isValid: false, error: 'Điểm số phải là một số hợp lệ.' };
  }
  if (numericScore < 0) {
    return { isValid: false, error: 'Điểm số không được nhỏ hơn 0.' };
  }
  if (numericScore > maxScore) {
    return { isValid: false, error: `Điểm số không được vượt quá điểm tối đa (${maxScore}).` };
  }
  return { isValid: true };
}

/**
 * Builds strict payload for PUT /api/assignments/{assignmentId}/submissions/{submissionId}/grade.
 * Contains ONLY score and feedback.
 * Score 0 is strictly preserved.
 * Whitespace or blank feedback is normalized to null.
 */
export function buildGradeSubmissionPayload(
  score: number | string,
  feedback?: string | null
): GradeSubmissionPayload {
  const numericScore = typeof score === 'number' ? score : Number(score);
  const normalizedFeedback = feedback && feedback.trim().length > 0 ? feedback.trim() : null;

  return {
    score: numericScore,
    feedback: normalizedFeedback
  };
}

/**
 * Clamps and normalizes pagination query params.
 */
export function normalizePagination(page?: number, pageSize?: number): { page: number; pageSize: number } {
  const normalizedPage = !page || page < 1 ? 1 : Math.floor(page);
  let normalizedPageSize = !pageSize || pageSize < 1 ? 10 : Math.floor(pageSize);
  if (normalizedPageSize > 100) {
    normalizedPageSize = 100;
  }
  return { page: normalizedPage, pageSize: normalizedPageSize };
}

/**
 * Builds query parameters for GET /api/grades/classes/{classId}.
 */
export function buildGradeQueryParams(params: GradeQueryParams = {}): Record<string, string | number | boolean> {
  const query: Record<string, string | number | boolean> = {};

  if (params.search && params.search.trim().length > 0) {
    query.search = params.search.trim();
  }

  if (params.membershipStatus) {
    query.membershipStatus = params.membershipStatus;
  }

  const { page, pageSize } = normalizePagination(params.page, params.pageSize);
  query.page = page;
  query.pageSize = pageSize;

  if (isValidSortField(params.sortBy)) {
    query.sortBy = params.sortBy!.trim().toLowerCase();
    query.isAscending = params.isAscending !== undefined ? params.isAscending : true;
  } else {
    query.sortBy = 'studentcode';
    query.isAscending = true;
  }

  return query;
}

/**
 * Determines whether a user role can manage grades.
 */
export function canManageGrades(role: string | null | undefined): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase();
  return normalized === 'admin' || normalized === 'staff' || normalized === 'teacher';
}

/**
 * Determines whether a grade item can be graded by an authorized manager.
 * Quizzes cannot be graded manually.
 * Missing items (submissionId == null) have no submission to grade.
 */
export function canGradeAssignmentItem(
  item: GradeItemResponse,
  role: string | null | undefined
): boolean {
  if (!canManageGrades(role)) return false;
  if (item.sourceType !== 'Assignment') return false;
  return item.submissionId !== null && item.submissionId !== undefined;
}
