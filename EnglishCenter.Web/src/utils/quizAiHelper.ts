import axios from 'axios';
import type {
  ApplyGeneratedQuestionItemRequest,
  ApplyGeneratedQuestionsRequest,
  ClassStatus,
  GenerateQuizQuestionsRequest,
  GeneratedQuizQuestionItemResponse,
  QuestionType,
  QuizAiDifficulty,
  QuizAiLanguage,
  QuizAiSourceType,
  QuizStatus
} from '../types/quiz.types';

export interface GeneratePayloadInput {
  sourceType: QuizAiSourceType;
  topic?: string | null;
  lessonId?: number | null;
  questionCount: number;
  questionTypes: QuestionType[];
  difficulty: QuizAiDifficulty;
  language: QuizAiLanguage;
  scorePerQuestion: number;
  additionalInstructions?: string | null;
}

export interface LessonItemForOption {
  id: number;
  title: string;
  sectionTitle: string;
  hasContent: boolean;
}

export interface MappedLessonOption {
  id: number;
  label: string;
  disabled: boolean;
  disabledReason?: string;
  hasContent: boolean;
}

/**
 * 1. buildGeneratePayload
 * Strict builder for GenerateQuizQuestionsRequest.
 * Enforces Topic vs Lesson source isolation, trims inputs, strips extraneous fields,
 * and sets inactive source property to null.
 */
export function buildGeneratePayload(input: GeneratePayloadInput): GenerateQuizQuestionsRequest {
  const isTopic = input.sourceType === 'Topic';

  // Topic mode: trimmed string, lessonId is strictly null
  const topic = isTopic ? (input.topic?.trim() ? input.topic.trim() : null) : null;

  // Lesson mode: topic is strictly null, lessonId parsed to integer
  const lessonId = !isTopic && input.lessonId != null ? Number(input.lessonId) : null;

  // Question count bounds: 1..20 (default 5)
  const rawCount = Number(input.questionCount);
  const questionCount = isNaN(rawCount) ? 5 : Math.max(1, Math.min(20, Math.floor(rawCount)));

  // Question types: deduplicated, filtered to valid enum types
  const allowedTypes: QuestionType[] = ['MultipleChoice', 'TrueFalse', 'FillInBlank'];
  const validTypes = (input.questionTypes || []).filter((t) => allowedTypes.includes(t));
  const uniqueTypes = Array.from(new Set(validTypes));

  // Score per question: default 1.0, bounds > 0, <= 999.99
  const rawScore = Number(input.scorePerQuestion);
  const scorePerQuestion = isNaN(rawScore) ? 1.0 : Math.max(0.01, Math.min(999.99, rawScore));

  // Additional instructions: optional, max 500 chars trimmed
  const trimmedInstructions = input.additionalInstructions?.trim() || null;
  const additionalInstructions =
    trimmedInstructions && trimmedInstructions.length > 500
      ? trimmedInstructions.slice(0, 500)
      : trimmedInstructions;

  return {
    sourceType: input.sourceType,
    topic,
    lessonId,
    questionCount,
    questionTypes: uniqueTypes,
    difficulty: input.difficulty,
    language: input.language,
    scorePerQuestion,
    additionalInstructions
  };
}

/**
 * 2. buildLessonLookupParams
 * Prepares strict query params for GET /api/Lessons with quiz.courseId and Published status.
 */
export function buildLessonLookupParams(
  quizCourseId: number,
  search?: string,
  page = 1,
  pageSize = 20
) {
  const trimmedSearch = search?.trim() || undefined;
  return {
    courseId: quizCourseId,
    status: 'Published' as const,
    page: page > 0 ? page : 1,
    pageSize: pageSize > 0 ? pageSize : 20,
    search: trimmedSearch
  };
}

/**
 * 3. mapLessonOptions
 * Maps lesson items to display labels [SectionTitle] Lesson Title
 * and flags hasContent === false as disabled with clear text.
 */
export function mapLessonOptions(lessons: LessonItemForOption[]): MappedLessonOption[] {
  if (!Array.isArray(lessons)) return [];

  return lessons.map((l) => ({
    id: l.id,
    label: `[${l.sectionTitle}] ${l.title}`,
    disabled: !l.hasContent,
    disabledReason: l.hasContent ? undefined : '[Chưa có nội dung văn bản]',
    hasContent: l.hasContent
  }));
}

/**
 * Helper to compute option badge labels: A, B, C... Z, AA, AB...
 */
export function getOptionBadgeLabel(index: number): string {
  if (index < 26) {
    return String.fromCharCode(65 + index);
  }
  const first = String.fromCharCode(65 + Math.floor(index / 26) - 1);
  const second = String.fromCharCode(65 + (index % 26));
  return `${first}${second}`;
}

/**
 * 4. buildApplyPayload
 * Strips tempId, explanation, orderIndex, quizId, and provider metadata.
 * Retains relative array order for persistence.
 */
export function buildApplyPayload(
  questions: GeneratedQuizQuestionItemResponse[]
): ApplyGeneratedQuestionsRequest {
  const mappedQuestions: ApplyGeneratedQuestionItemRequest[] = (questions || []).map((q) => {
    const scoreVal = Number(q.score);
    const score = isNaN(scoreVal) ? 1.0 : Math.max(0.01, Math.min(999.99, scoreVal));

    if (q.questionType === 'FillInBlank') {
      return {
        content: q.content.trim(),
        questionType: 'FillInBlank',
        score,
        correctTextAnswer: q.correctTextAnswer ? q.correctTextAnswer.trim() : '',
        options: null
      };
    }

    const options = (q.options || []).map((opt) => ({
      content: opt.content.trim(),
      isCorrect: Boolean(opt.isCorrect)
    }));

    return {
      content: q.content.trim(),
      questionType: q.questionType,
      score,
      correctTextAnswer: null,
      options
    };
  });

  return {
    questions: mappedQuestions
  };
}

/**
 * 5. validateProposal
 * Validates local edited proposal questions before sending Apply request.
 */
export function validateProposal(questions: GeneratedQuizQuestionItemResponse[]): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!questions || questions.length === 0) {
    errors.push('Đề xuất phải có ít nhất 1 câu hỏi để lưu vào bài kiểm tra.');
    return { isValid: false, errors };
  }

  questions.forEach((q, index) => {
    const qNum = index + 1;
    if (!q.content || !q.content.trim()) {
      errors.push(`Câu hỏi #${qNum}: Nội dung câu hỏi không được để trống.`);
    }

    const score = Number(q.score);
    if (isNaN(score) || score <= 0 || score > 999.99) {
      errors.push(`Câu hỏi #${qNum}: Điểm số phải lớn hơn 0 và không vượt quá 999.99.`);
    }

    if (q.questionType === 'MultipleChoice') {
      const opts = q.options || [];
      if (opts.length < 2) {
        errors.push(`Câu hỏi #${qNum} (Trắc nghiệm): Phải có ít nhất 2 lựa chọn đáp án.`);
      }
      const hasEmptyOpt = opts.some((o) => !o.content || !o.content.trim());
      if (hasEmptyOpt) {
        errors.push(`Câu hỏi #${qNum} (Trắc nghiệm): Tất cả các đáp án phải có nội dung.`);
      }
      const correctCount = opts.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        errors.push(`Câu hỏi #${qNum} (Trắc nghiệm): Phải có chính xác 1 đáp án đúng.`);
      }
    } else if (q.questionType === 'TrueFalse') {
      const opts = q.options || [];
      if (opts.length !== 2) {
        errors.push(`Câu hỏi #${qNum} (Đúng/Sai): Phải có chính xác 2 lựa chọn đáp án.`);
      }
      const hasEmptyOpt = opts.some((o) => !o.content || !o.content.trim());
      if (hasEmptyOpt) {
        errors.push(`Câu hỏi #${qNum} (Đúng/Sai): Các lựa chọn đáp án không được để trống.`);
      }
      const correctCount = opts.filter((o) => o.isCorrect).length;
      if (correctCount !== 1) {
        errors.push(`Câu hỏi #${qNum} (Đúng/Sai): Phải có chính xác 1 đáp án đúng.`);
      }
    } else if (q.questionType === 'FillInBlank') {
      if (!q.correctTextAnswer || !q.correctTextAnswer.trim()) {
        errors.push(`Câu hỏi #${qNum} (Điền từ): Đáp án văn bản chính xác không được để trống.`);
      }
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 6. reorderProposal
 * Returns a new array with the question moved from fromIndex to toIndex.
 */
export function reorderProposal(
  questions: GeneratedQuizQuestionItemResponse[],
  fromIndex: number,
  toIndex: number
): GeneratedQuizQuestionItemResponse[] {
  if (
    fromIndex < 0 ||
    fromIndex >= questions.length ||
    toIndex < 0 ||
    toIndex >= questions.length ||
    fromIndex === toIndex
  ) {
    return [...questions];
  }

  const result = [...questions];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * 7. getAiErrorMessage
 * Contextual mapping of HTTP response errors to clear Vietnamese messages.
 * Strips provider internals and credentials.
 */
export function getAiErrorMessage(err: unknown): string {
  if (axios.isCancel(err) || (err instanceof Error && err.name === 'CanceledError')) {
    return 'Yêu cầu đã được hủy.';
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data as { message?: string } | undefined;
    const serverMsg = typeof data?.message === 'string' ? data.message : null;

    if (status === 400) {
      return (
        serverMsg ||
        'Yêu cầu tạo câu hỏi không hợp lệ hoặc bài học chưa sẵn sàng/không có nội dung văn bản.'
      );
    }
    if (status === 401) {
      return 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.';
    }
    if (status === 403) {
      return 'Bạn không có quyền thực hiện thao tác tạo câu hỏi AI cho bài kiểm tra này.';
    }
    if (status === 409) {
      return 'Trạng thái bài kiểm tra đã thay đổi hoặc đã có lượt làm bài. Vui lòng làm mới trang.';
    }
    if (status === 422) {
      return (
        serverMsg ||
        'AI không thể tạo câu hỏi phù hợp với tiêu chuẩn an toàn hoặc định dạng yêu cầu. Vui lòng thử lại với chủ đề khác.'
      );
    }
    if (status === 429) {
      const retryAfterHeader = err.response?.headers?.['retry-after'];
      const retrySec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : NaN;
      if (!isNaN(retrySec) && retrySec > 0) {
        return `Bạn đã đạt giới hạn yêu cầu tạo câu hỏi bằng AI. Vui lòng thử lại sau ${retrySec} giây.`;
      }
      return 'Bạn đã đạt giới hạn yêu cầu tạo câu hỏi bằng AI (10 lần/10 phút). Vui lòng thử lại sau.';
    }
    if (status === 502) {
      return 'Dịch vụ AI phản hồi không hợp lệ từ máy chủ. Vui lòng thử lại sau.';
    }
    if (status === 503) {
      return 'Hệ thống AI tạm thời không khả dụng. Vui lòng kiểm tra lại cấu hình hoặc thử lại sau.';
    }
    if (status === 504) {
      return 'Quá thời gian chờ phản hồi từ AI (timeout). Vui lòng thử lại với số lượng câu hỏi ít hơn.';
    }
  }

  if (err instanceof Error && err.message) {
    // Sanitize any accidental provider/SDK strings
    const msg = err.message;
    if (!msg.includes('Google') && !msg.includes('Gemini') && !msg.includes('key')) {
      return msg;
    }
  }

  return 'Đã xảy ra lỗi khi tạo câu hỏi bằng AI. Vui lòng thử lại.';
}

/**
 * 8. isQuizEligibleForAi
 * Derives eligibility from Quiz state.
 * Eligible only when: Draft, 0 attempts, class not Completed, class not Cancelled.
 */
export function isQuizEligibleForAi(
  quiz: {
    status?: QuizStatus;
    attemptCount?: number;
    classStatus?: ClassStatus;
  } | null
): boolean {
  if (!quiz) return false;
  return (
    quiz.status === 'Draft' &&
    (quiz.attemptCount ?? 0) === 0 &&
    quiz.classStatus !== 'Completed' &&
    quiz.classStatus !== 'Cancelled'
  );
}
