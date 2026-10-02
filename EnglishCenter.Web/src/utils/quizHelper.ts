import type {
  CreateQuestionRequest,
  CreateQuizRequest,
  ManagementAttemptDetailResponse,
  QuestionOptionRequest,
  QuestionType,
  QuizAttemptStatus,
  QuizListItemResponse,
  QuizStatus,
  SaveAnswerRequest,
  StudentAttemptDetailResponse,
  StudentAttemptReviewResponse,
  StudentOpenQuizResultResponse,
  StudentQuizDetailResponse,
  UpdateQuestionRequest,
  UpdateQuizRequest
} from '../types/quiz.types';

/**
 * Converts a backend UTC ISO string into a local 'YYYY-MM-DDTHH:mm' string
 * suitable for <input type="datetime-local">.
 */
export function utcToLocalInput(utcIsoString: string | null | undefined): string {
  if (!utcIsoString || !utcIsoString.trim()) return '';
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
export function localInputToUtc(localString: string | null | undefined): string | null {
  if (!localString || !localString.trim()) return null;
  const date = new Date(localString);
  if (isNaN(date.getTime())) return null;
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
 * Bijective base-26 spreadsheet-style column label generator:
 * 0 -> A, 25 -> Z, 26 -> AA, 27 -> AB, 51 -> AZ, 52 -> BA ...
 * Strictly prevents ASCII boundary symbols like '[', '\', ']', '^'.
 */
export function getOptionBadgeLabel(index: number): string {
  if (index < 0) return '';
  let label = '';
  let n = index;
  while (n >= 0) {
    label = String.fromCharCode(65 + (n % 26)) + label;
    n = Math.floor(n / 26) - 1;
  }
  return label;
}

/**
 * Calculates remaining seconds between now and an effective deadline ISO string.
 * Returns null if deadline is null/undefined.
 * Returns 0 if deadline has already passed.
 */
export function calculateRemainingSeconds(effectiveDeadlineIso: string | null | undefined): number | null {
  if (!effectiveDeadlineIso) return null;
  const deadline = new Date(effectiveDeadlineIso);
  if (isNaN(deadline.getTime())) return null;

  const now = Date.now();
  const diffSec = Math.floor((deadline.getTime() - now) / 1000);
  return Math.max(0, diffSec);
}

/**
 * Formats remaining seconds into mm:ss or hh:mm:ss string.
 */
export function formatRemainingTime(seconds: number | null): string {
  if (seconds === null) return 'Không giới hạn thời gian';
  if (seconds <= 0) return '00:00';

  const pad = (n: number) => n.toString().padStart(2, '0');
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
  }
  return `${pad(minutes)}:${pad(secs)}`;
}

/**
 * Formats a quiz or attempt score.
 * Correctly distinguishes null/undefined ("Chờ công bố") from numeric zero (0 / 0.0 -> "0").
 */
export function formatScore(
  score: number | null | undefined,
  maxScore?: number,
  appendUnit = false
): string {
  if (score === null || score === undefined) {
    return 'Chờ công bố';
  }
  const formattedScore = Number.isInteger(score)
    ? score.toString()
    : parseFloat(score.toFixed(2)).toString();
  if (maxScore !== undefined && maxScore > 0) {
    const formattedMax = Number.isInteger(maxScore)
      ? maxScore.toString()
      : parseFloat(maxScore.toFixed(2)).toString();
    return `${formattedScore} / ${formattedMax} điểm`;
  }
  return appendUnit ? `${formattedScore} điểm` : formattedScore;
}

/**
 * Type guard for ManagementAttemptDetailResponse.
 * Guaranteed by presence of studentId (which never exists on Student responses).
 */
export function isManagementAttempt(dto: unknown): dto is ManagementAttemptDetailResponse {
  if (!dto || typeof dto !== 'object') return false;
  const item = dto as Record<string, unknown>;
  return 'studentId' in item && typeof item.studentId === 'number';
}

/**
 * Type guard for StudentAttemptDetailResponse (taking in progress).
 * Status must be 'InProgress' and contains questions array without submittedAnswers.
 */
export function isStudentAttemptTaking(dto: unknown): dto is StudentAttemptDetailResponse {
  if (!dto || typeof dto !== 'object') return false;
  const item = dto as Record<string, unknown>;
  return (
    item.status === 'InProgress' &&
    Array.isArray(item.questions) &&
    !('submittedAnswers' in item) &&
    !('studentId' in item)
  );
}

/**
 * Type guard for StudentOpenQuizResultResponse (locked result).
 * Contains submittedAnswers array, totalScore is strictly null, and no questions array.
 */
export function isStudentOpenResult(dto: unknown): dto is StudentOpenQuizResultResponse {
  if (!dto || typeof dto !== 'object') return false;
  const item = dto as Record<string, unknown>;
  return (
    'submittedAnswers' in item &&
    Array.isArray(item.submittedAnswers) &&
    item.totalScore === null &&
    !('questions' in item) &&
    !('studentId' in item)
  );
}

/**
 * Type guard for StudentAttemptReviewResponse (full review).
 * Contains numeric totalScore and questions array with question review items.
 */
export function isStudentAttemptReview(dto: unknown): dto is StudentAttemptReviewResponse {
  if (!dto || typeof dto !== 'object') return false;
  const item = dto as Record<string, unknown>;
  return (
    'totalScore' in item &&
    typeof item.totalScore === 'number' &&
    Array.isArray(item.questions) &&
    !('studentId' in item)
  );
}

export interface StatusBadgeInfo {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export function getQuizStatusBadge(status: QuizStatus): StatusBadgeInfo {
  switch (status) {
    case 'Draft':
      return { label: 'Bản nháp', variant: 'neutral' };
    case 'Published':
      return { label: 'Đang mở', variant: 'success' };
    case 'Closed':
      return { label: 'Đã đóng', variant: 'warning' };
    default:
      return { label: status, variant: 'neutral' };
  }
}

export function getQuizAttemptStatusBadge(status: QuizAttemptStatus): StatusBadgeInfo {
  switch (status) {
    case 'InProgress':
      return { label: 'Đang làm bài', variant: 'warning' };
    case 'Submitted':
      return { label: 'Đã nộp bài', variant: 'success' };
    case 'Expired':
      return { label: 'Đã hết hạn', variant: 'danger' };
    default:
      return { label: status, variant: 'neutral' };
  }
}

export function getQuestionTypeLabel(type: QuestionType): string {
  switch (type) {
    case 'MultipleChoice':
      return 'Trắc nghiệm nhiều lựa chọn';
    case 'TrueFalse':
      return 'Đúng / Sai';
    case 'FillInBlank':
      return 'Điền vào chỗ trống';
    default:
      return type;
  }
}

export interface StudentQuizEligibility {
  canStart: boolean;
  canResume: boolean;
  reason: string | null;
  buttonLabel: string;
}

export function getStudentQuizEligibility(
  quiz: QuizListItemResponse | StudentQuizDetailResponse
): StudentQuizEligibility {
  // If active attempt exists, resume is always available
  if (quiz.hasActiveAttempt) {
    return {
      canStart: false,
      canResume: true,
      reason: 'Bạn đang có một lượt làm bài chưa hoàn thành.',
      buttonLabel: 'Tiếp tục làm bài'
    };
  }

  // Membership constraints
  if (quiz.studentMembershipStatus === 'Withdrawn') {
    return {
      canStart: false,
      canResume: false,
      reason: 'Học viên đã rút lui khỏi lớp học này.',
      buttonLabel: 'Đã rút lui'
    };
  }
  if (quiz.studentMembershipStatus === 'Completed') {
    return {
      canStart: false,
      canResume: false,
      reason: 'Học viên đã hoàn thành khóa học (chế độ xem lịch sử).',
      buttonLabel: 'Đã hoàn thành'
    };
  }

  // Class status constraints
  if (quiz.classStatus === 'Planned') {
    return {
      canStart: false,
      canResume: false,
      reason: 'Lớp học chưa bắt đầu. Bạn chưa thể làm bài kiểm tra.',
      buttonLabel: 'Chưa mở'
    };
  }
  if (quiz.classStatus === 'Cancelled') {
    return {
      canStart: false,
      canResume: false,
      reason: 'Lớp học đã bị hủy.',
      buttonLabel: 'Đã hủy'
    };
  }

  // Quiz lifecycle status
  if (quiz.status === 'Draft') {
    return {
      canStart: false,
      canResume: false,
      reason: 'Bài kiểm tra đang ở trạng thái bản nháp.',
      buttonLabel: 'Chưa mở'
    };
  }
  if (quiz.status === 'Closed') {
    return {
      canStart: false,
      canResume: false,
      reason: 'Bài kiểm tra đã đóng. Không nhận thêm lượt làm bài mới.',
      buttonLabel: 'Đã đóng'
    };
  }

  // Time window constraints
  const now = Date.now();
  if (quiz.startAt) {
    const start = new Date(quiz.startAt).getTime();
    if (now < start) {
      return {
        canStart: false,
        canResume: false,
        reason: `Bài kiểm tra sẽ mở lúc ${formatDateTime(quiz.startAt)}.`,
        buttonLabel: 'Chưa đến giờ'
      };
    }
  }

  if (quiz.endAt) {
    const end = new Date(quiz.endAt).getTime();
    if (now > end) {
      return {
        canStart: false,
        canResume: false,
        reason: 'Đã quá thời hạn kết thúc bài kiểm tra.',
        buttonLabel: 'Hết hạn'
      };
    }
  }

  // Max attempts constraint
  if (quiz.attemptCount >= quiz.maxAttempts) {
    return {
      canStart: false,
      canResume: false,
      reason: `Hết số lượt làm bài tối đa (${quiz.attemptCount}/${quiz.maxAttempts}).`,
      buttonLabel: 'Hết lượt làm bài'
    };
  }

  return {
    canStart: true,
    canResume: false,
    reason: null,
    buttonLabel: 'Bắt đầu làm bài'
  };
}

// Strict payload builders: Sanitize and strip forbidden or unmapped properties
export function buildCreateQuizPayload(form: {
  classId: number;
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  maxAttempts: number;
  startAt?: string | null;
  endAt?: string | null;
}): CreateQuizRequest {
  return {
    classId: Number(form.classId),
    title: form.title.trim(),
    description: form.description?.trim() ? form.description.trim() : null,
    durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
    maxAttempts: Number(form.maxAttempts),
    startAt: form.startAt ? localInputToUtc(form.startAt) : null,
    endAt: form.endAt ? localInputToUtc(form.endAt) : null
  };
}

export function buildUpdateQuizPayload(form: {
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  maxAttempts: number;
  startAt?: string | null;
  endAt?: string | null;
}): UpdateQuizRequest {
  return {
    title: form.title.trim(),
    description: form.description?.trim() ? form.description.trim() : null,
    durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
    maxAttempts: Number(form.maxAttempts),
    startAt: form.startAt ? localInputToUtc(form.startAt) : null,
    endAt: form.endAt ? localInputToUtc(form.endAt) : null
  };
}

export function buildCreateQuestionPayload(form: {
  content: string;
  questionType: QuestionType;
  correctTextAnswer?: string | null;
  score: number;
  orderIndex: number;
  options?: QuestionOptionRequest[];
}): CreateQuestionRequest {
  const payload: CreateQuestionRequest = {
    content: form.content.trim(),
    questionType: form.questionType,
    score: Number(form.score),
    orderIndex: Number(form.orderIndex)
  };

  if (form.questionType === 'FillInBlank') {
    payload.correctTextAnswer = form.correctTextAnswer?.trim() || '';
    payload.options = null;
  } else {
    payload.correctTextAnswer = null;
    payload.options = (form.options || []).map((opt, i) => ({
      content: opt.content.trim(),
      isCorrect: Boolean(opt.isCorrect),
      orderIndex: opt.orderIndex !== undefined ? Number(opt.orderIndex) : i + 1
    }));
  }

  return payload;
}

export function buildUpdateQuestionPayload(form: {
  content: string;
  questionType: QuestionType;
  correctTextAnswer?: string | null;
  score: number;
  orderIndex: number;
  options?: QuestionOptionRequest[];
}): UpdateQuestionRequest {
  return buildCreateQuestionPayload(form);
}

export function buildSaveAnswerPayload(
  formOrOptionId?:
    | { selectedOptionId?: number | null; textAnswer?: string | null }
    | number
    | null,
  maybeTextAnswer?: string | null
): SaveAnswerRequest {
  if (typeof formOrOptionId === 'object' && formOrOptionId !== null) {
    return {
      selectedOptionId: formOrOptionId.selectedOptionId ? Number(formOrOptionId.selectedOptionId) : null,
      textAnswer:
        formOrOptionId.textAnswer !== undefined && formOrOptionId.textAnswer !== null
          ? formOrOptionId.textAnswer.trim() || null
          : null
    };
  }
  return {
    selectedOptionId: formOrOptionId ? Number(formOrOptionId) : null,
    textAnswer:
      maybeTextAnswer !== undefined && maybeTextAnswer !== null
        ? maybeTextAnswer.trim() || null
        : null
  };
}
