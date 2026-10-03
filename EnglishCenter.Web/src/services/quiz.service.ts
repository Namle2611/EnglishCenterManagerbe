import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  ApplyGeneratedQuestionsRequest,
  CreateQuestionRequest,
  CreateQuizRequest,
  GenerateQuizQuestionsRequest,
  GeneratedQuizQuestionsResponse,
  ManagementAttemptDetailResponse,
  QuestionManagementResponse,
  QuizAttemptListItemResponse,
  QuizAttemptQueryParams,
  QuizDetailResponse,
  QuizListItemResponse,
  QuizQueryParams,
  SaveAnswerRequest,
  StudentAnswerResponse,
  StudentAttemptDetailResponse,
  StudentAttemptReviewResponse,
  StudentAttemptSummaryResponse,
  StudentOpenQuizResultResponse,
  StudentQuizDetailResponse,
  TeacherQuizClassLookupItemResponse,
  TeacherQuizClassLookupParams,
  UpdateQuestionRequest,
  UpdateQuizRequest
} from '../types/quiz.types';
import {
  buildCreateQuestionPayload,
  buildCreateQuizPayload,
  buildSaveAnswerPayload,
  buildUpdateQuestionPayload,
  buildUpdateQuizPayload
} from '../utils/quizHelper';

export const quizService = {
  /**
   * 1. GET /api/quizzes - List quizzes for current user (filtered by role/class).
   */
  async getQuizzes(
    params: QuizQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<QuizListItemResponse>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<QuizListItemResponse>>>(
      '/quizzes',
      {
        params: {
          classId: params.classId || undefined,
          status: params.status || undefined,
          fromDate: params.fromDate || undefined,
          toDate: params.toDate || undefined,
          search: params.search?.trim() || undefined,
          sortBy: params.sortBy || undefined,
          sortDirection: params.sortDirection || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * 2. GET /api/quizzes/lookups/classes - Class lookup for teachers/admins/staff.
   */
  async getTeacherClassLookup(
    params: TeacherQuizClassLookupParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<TeacherQuizClassLookupItemResponse>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<TeacherQuizClassLookupItemResponse>>>(
      '/quizzes/lookups/classes',
      {
        params: {
          search: params.search?.trim() || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 20
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * 3. GET /api/quizzes/{id} - Get quiz detail.
   * If student: returns StudentQuizDetailResponse (no questions).
   * If teacher/admin/staff: returns QuizDetailResponse (with questions).
   */
  async getQuizDetail(
    id: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuizDetailResponse | StudentQuizDetailResponse>> {
    const response = await axiosClient.get<ApiResponse<QuizDetailResponse | StudentQuizDetailResponse>>(
      `/quizzes/${id}`,
      { signal }
    );
    return response.data;
  },

  /**
   * 4. POST /api/quizzes - Create quiz (Draft).
   */
  async createQuiz(
    form: {
      classId: number;
      title: string;
      description?: string | null;
      durationMinutes?: number | null;
      maxAttempts: number;
      startAt?: string | null;
      endAt?: string | null;
    }
  ): Promise<ApiResponse<QuizDetailResponse>> {
    const payload: CreateQuizRequest = buildCreateQuizPayload(form);
    const response = await axiosClient.post<ApiResponse<QuizDetailResponse>>('/quizzes', payload);
    return response.data;
  },

  /**
   * 5. PUT /api/quizzes/{id} - Update quiz metadata.
   */
  async updateQuiz(
    id: number,
    form: {
      title: string;
      description?: string | null;
      durationMinutes?: number | null;
      maxAttempts: number;
      startAt?: string | null;
      endAt?: string | null;
    }
  ): Promise<ApiResponse<QuizDetailResponse>> {
    const payload: UpdateQuizRequest = buildUpdateQuizPayload(form);
    const response = await axiosClient.put<ApiResponse<QuizDetailResponse>>(`/quizzes/${id}`, payload);
    return response.data;
  },

  /**
   * 6. DELETE /api/quizzes/{id} - Delete quiz (only if 0 attempts exist).
   */
  async deleteQuiz(id: number): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete<ApiResponse<void>>(`/quizzes/${id}`);
    return response.data;
  },

  /**
   * 7. POST /api/quizzes/{id}/publish - Publish draft quiz.
   */
  async publishQuiz(id: number): Promise<ApiResponse<QuizDetailResponse>> {
    const response = await axiosClient.post<ApiResponse<QuizDetailResponse>>(`/quizzes/${id}/publish`);
    return response.data;
  },

  /**
   * 8. POST /api/quizzes/{id}/close - Close published quiz.
   */
  async closeQuiz(id: number): Promise<ApiResponse<QuizDetailResponse>> {
    const response = await axiosClient.post<ApiResponse<QuizDetailResponse>>(`/quizzes/${id}/close`);
    return response.data;
  },

  /**
   * 9. POST /api/quizzes/{id}/reopen - Reopen closed quiz.
   */
  async reopenQuiz(id: number): Promise<ApiResponse<QuizDetailResponse>> {
    const response = await axiosClient.post<ApiResponse<QuizDetailResponse>>(`/quizzes/${id}/reopen`);
    return response.data;
  },

  /**
   * 10. GET /api/quizzes/{id}/questions - List management questions.
   */
  async getQuestions(
    quizId: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionManagementResponse[]>> {
    const response = await axiosClient.get<ApiResponse<QuestionManagementResponse[]>>(
      `/quizzes/${quizId}/questions`,
      { signal }
    );
    return response.data;
  },

  /**
   * 11. POST /api/quizzes/{id}/questions - Create a question.
   */
  async createQuestion(
    quizId: number,
    form: Parameters<typeof buildCreateQuestionPayload>[0]
  ): Promise<ApiResponse<QuestionManagementResponse>> {
    const payload: CreateQuestionRequest = buildCreateQuestionPayload(form);
    const response = await axiosClient.post<ApiResponse<QuestionManagementResponse>>(
      `/quizzes/${quizId}/questions`,
      payload
    );
    return response.data;
  },

  /**
   * 12. PUT /api/quizzes/{id}/questions/{questionId} - Update a question with full options replacement.
   */
  async updateQuestion(
    quizId: number,
    questionId: number,
    form: Parameters<typeof buildUpdateQuestionPayload>[0]
  ): Promise<ApiResponse<QuestionManagementResponse>> {
    const payload: UpdateQuestionRequest = buildUpdateQuestionPayload(form);
    const response = await axiosClient.put<ApiResponse<QuestionManagementResponse>>(
      `/quizzes/${quizId}/questions/${questionId}`,
      payload
    );
    return response.data;
  },

  /**
   * 13. DELETE /api/quizzes/{id}/questions/{questionId} - Delete a question.
   */
  async deleteQuestion(quizId: number, questionId: number): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete<ApiResponse<void>>(
      `/quizzes/${quizId}/questions/${questionId}`
    );
    return response.data;
  },

  /**
   * 14. GET /api/quizzes/{id}/attempts - Get attempts for quiz (Management).
   */
  async getAttempts(
    quizId: number,
    params: QuizAttemptQueryParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<QuizAttemptListItemResponse>>> {
    const response = await axiosClient.get<ApiResponse<PagedResult<QuizAttemptListItemResponse>>>(
      `/quizzes/${quizId}/attempts`,
      {
        params: {
          search: params.search?.trim() || undefined,
          studentId: params.studentId || undefined,
          status: params.status || undefined,
          sortBy: params.sortBy || undefined,
          sortDirection: params.sortDirection || undefined,
          page: params.page || 1,
          pageSize: params.pageSize || 10
        },
        signal
      }
    );
    return response.data;
  },

  /**
   * 15. GET /api/quizzes/{id}/my-attempts - Get student personal attempt history.
   */
  async getMyAttempts(
    quizId: number,
    signal?: AbortSignal
  ): Promise<ApiResponse<StudentAttemptSummaryResponse[]>> {
    const response = await axiosClient.get<ApiResponse<StudentAttemptSummaryResponse[]>>(
      `/quizzes/${quizId}/my-attempts`,
      { signal }
    );
    return response.data;
  },

  /**
   * 16. POST /api/quizzes/{id}/attempts - Start new or resume active attempt.
   */
  async startAttempt(quizId: number): Promise<ApiResponse<StudentAttemptDetailResponse>> {
    const response = await axiosClient.post<ApiResponse<StudentAttemptDetailResponse>>(
      `/quizzes/${quizId}/attempts`
    );
    return response.data;
  },

  /**
   * 17. GET /api/quiz-attempts/{id} - Get attempt details.
   * Student InProgress -> StudentAttemptDetailResponse
   * Student Locked Result -> StudentOpenQuizResultResponse
   * Student Full Review -> StudentAttemptReviewResponse
   * Management -> ManagementAttemptDetailResponse
   */
  async getAttemptDetail(
    attemptId: number,
    signal?: AbortSignal
  ): Promise<
    ApiResponse<
      | StudentAttemptDetailResponse
      | StudentOpenQuizResultResponse
      | StudentAttemptReviewResponse
      | ManagementAttemptDetailResponse
    >
  > {
    const response = await axiosClient.get<
      ApiResponse<
        | StudentAttemptDetailResponse
        | StudentOpenQuizResultResponse
        | StudentAttemptReviewResponse
        | ManagementAttemptDetailResponse
      >
    >(`/quiz-attempts/${attemptId}`, { signal });
    return response.data;
  },

  /**
   * 18. PUT /api/quiz-attempts/{id}/answers/{questionId} - Save individual answer.
   */
  async saveAnswer(
    attemptId: number,
    questionId: number,
    form: { selectedOptionId?: number | null; textAnswer?: string | null }
  ): Promise<ApiResponse<StudentAnswerResponse>> {
    const payload: SaveAnswerRequest = buildSaveAnswerPayload(form);
    const response = await axiosClient.put<ApiResponse<StudentAnswerResponse>>(
      `/quiz-attempts/${attemptId}/answers/${questionId}`,
      payload
    );
    return response.data;
  },

  /**
   * 19. POST /api/quiz-attempts/{id}/submit - Submit attempt.
   * Returns StudentAttemptReviewResponse (if unlocked) or StudentOpenQuizResultResponse (if locked).
   */
  async submitAttempt(
    attemptId: number
  ): Promise<ApiResponse<StudentAttemptReviewResponse | StudentOpenQuizResultResponse>> {
    const response = await axiosClient.post<
      ApiResponse<StudentAttemptReviewResponse | StudentOpenQuizResultResponse>
    >(`/quiz-attempts/${attemptId}/submit`);
    return response.data;
  },

  /**
   * 20. POST /api/ai/quizzes/{quizId}/generate-questions - Generate question proposals using AI.
   */
  async generateAiQuestions(
    quizId: number,
    payload: GenerateQuizQuestionsRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<GeneratedQuizQuestionsResponse>> {
    const response = await axiosClient.post<ApiResponse<GeneratedQuizQuestionsResponse>>(
      `/ai/quizzes/${quizId}/generate-questions`,
      payload,
      { signal }
    );
    return response.data;
  },

  /**
   * 21. POST /api/ai/quizzes/{quizId}/apply-questions - Atomically persist generated AI questions.
   * Note: This request must NOT be automatically retried.
   */
  async applyAiQuestions(
    quizId: number,
    payload: ApplyGeneratedQuestionsRequest,
    signal?: AbortSignal
  ): Promise<ApiResponse<QuestionManagementResponse[]>> {
    const response = await axiosClient.post<ApiResponse<QuestionManagementResponse[]>>(
      `/ai/quizzes/${quizId}/apply-questions`,
      payload,
      { signal }
    );
    return response.data;
  }
};

/**
 * Per-Question Serial Save Coordinator
 * Ensures:
 * - At most ONE PUT in flight per question at any moment.
 * - Coalesces rapid intermediate values (A -> B -> C ends with C).
 * - Stale network response never overwrites local state.
 * - Saves for different questions proceed independently.
 */
export type SaveAnswerFn = (
  attemptId: number,
  questionId: number,
  form: { selectedOptionId?: number | null; textAnswer?: string | null }
) => Promise<unknown>;

export class QuestionAnswerCoordinator {
  public readonly questionId: number;
  private readonly attemptId: number;

  public confirmedValue: { selectedOptionId: number | null; textAnswer: string | null };
  public latestLocalValue: { selectedOptionId: number | null; textAnswer: string | null };
  public isSaving = false;
  public pendingDirty = false;
  public saveStatus: 'saved' | 'saving' | 'unsaved' | 'error' = 'saved';
  public errorMessage: string | null = null;

  private onStateChange?: () => void;
  private currentPromise: Promise<void> | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private saveFn?: SaveAnswerFn;

  constructor(
    attemptId: number,
    questionId: number,
    initialValue: { selectedOptionId: number | null; textAnswer: string | null },
    onStateChange?: () => void,
    saveFn?: SaveAnswerFn
  ) {
    this.attemptId = attemptId;
    this.questionId = questionId;
    this.confirmedValue = { ...initialValue };
    this.latestLocalValue = { ...initialValue };
    this.onStateChange = onStateChange;
    this.saveFn = saveFn;
  }

  public setListener(listener: () => void) {
    this.onStateChange = listener;
  }

  private notify() {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  public cancelDebounce() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  /**
   * Updates local value and triggers save with optional debounce (e.g. 500ms for FillInBlank).
   */
  public updateValue(
    value: { selectedOptionId?: number | null; textAnswer?: string | null },
    debounceMs = 0
  ) {
    this.latestLocalValue = {
      selectedOptionId: value.selectedOptionId ?? null,
      textAnswer: value.textAnswer ?? null
    };

    const isDifferentFromConfirmed =
      this.latestLocalValue.selectedOptionId !== this.confirmedValue.selectedOptionId ||
      this.latestLocalValue.textAnswer !== this.confirmedValue.textAnswer;

    if (isDifferentFromConfirmed) {
      this.saveStatus = 'unsaved';
      this.pendingDirty = true;
    } else {
      this.saveStatus = 'saved';
      this.pendingDirty = false;
    }
    this.errorMessage = null;
    this.notify();

    this.cancelDebounce();

    if (debounceMs > 0) {
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = null;
        this.processQueue();
      }, debounceMs);
    } else {
      this.processQueue();
    }
  }

  public queueUpdate(
    value: { selectedOptionId?: number | null; textAnswer?: string | null },
    immediate = false
  ) {
    this.updateValue(value, immediate ? 0 : 500);
  }

  public retry() {
    this.processQueue();
  }

  /**
   * Flushes any pending debounce immediately into the save queue.
   */
  public flushDebounce() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
      this.processQueue();
    }
  }

  /**
   * The core serialized save loop.
   */
  public async processQueue(): Promise<void> {
    if (this.isSaving) {
      // Mark pendingDirty so that when the active save resolves, it continues
      this.pendingDirty = true;
      return;
    }

    // Check if there is anything dirty to save
    const needsSave =
      this.latestLocalValue.selectedOptionId !== this.confirmedValue.selectedOptionId ||
      this.latestLocalValue.textAnswer !== this.confirmedValue.textAnswer ||
      this.pendingDirty;

    if (!needsSave) {
      this.saveStatus = 'saved';
      this.notify();
      return;
    }

    this.isSaving = true;
    this.pendingDirty = false;
    this.saveStatus = 'saving';
    this.errorMessage = null;
    this.notify();

    // Snapshot the current local value to send
    const snapshotToSend = { ...this.latestLocalValue };

    this.currentPromise = (async () => {
      try {
        if (this.saveFn) {
          await this.saveFn(this.attemptId, this.questionId, snapshotToSend);
        } else {
          await quizService.saveAnswer(this.attemptId, this.questionId, snapshotToSend);
        }
        this.confirmedValue = { ...snapshotToSend };
        this.isSaving = false;

        // If local value changed while this request was flying, process again immediately
        const stillDirty =
          this.latestLocalValue.selectedOptionId !== this.confirmedValue.selectedOptionId ||
          this.latestLocalValue.textAnswer !== this.confirmedValue.textAnswer ||
          this.pendingDirty;

        if (stillDirty) {
          await this.processQueue();
        } else {
          this.saveStatus = 'saved';
          this.errorMessage = null;
          this.notify();
        }
      } catch (err: unknown) {
        this.isSaving = false;
        this.saveStatus = 'error';
        const msg = err instanceof Error ? err.message : 'Lưu câu trả lời thất bại';
        this.errorMessage = msg;
        this.notify();
      }
    })();

    await this.currentPromise;
  }

  /**
   * Waits until the coordinator is completely settled (no active PUT, no pending debounce).
   */
  public async waitForSettled(): Promise<void> {
    this.flushDebounce();
    while (this.isSaving && this.currentPromise) {
      await this.currentPromise;
    }
  }
}
