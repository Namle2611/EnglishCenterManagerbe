export type QuizStatus = 'Draft' | 'Published' | 'Closed';

export type QuestionType = 'MultipleChoice' | 'TrueFalse' | 'FillInBlank';

export type QuizAttemptStatus = 'InProgress' | 'Submitted' | 'Expired';

export type ClassStatus = 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled';

export type ClassStudentStatus = 'Active' | 'Completed' | 'Withdrawn';

export interface QuizListItemResponse {
  id: number;
  classId: number;
  classCode: string;
  courseName: string;
  classStatus: ClassStatus;
  studentMembershipStatus: ClassStudentStatus | null;
  teacherName: string;
  title: string;
  durationMinutes: number | null;
  maxAttempts: number;
  startAt: string | null;
  endAt: string | null;
  status: QuizStatus;
  maxScore: number;
  questionCount: number;
  attemptCount: number;
  hasActiveAttempt: boolean | null;
}

export interface QuizDetailResponse {
  id: number;
  classId: number;
  courseId: number;
  classCode: string;
  courseName: string;
  classStatus: ClassStatus;
  teacherName: string;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  maxAttempts: number;
  startAt: string | null;
  endAt: string | null;
  status: QuizStatus;
  maxScore: number;
  questionCount: number;
  attemptCount: number;
  questions: QuestionManagementResponse[];
}

export interface StudentQuizDetailResponse {
  id: number;
  classId: number;
  classCode: string;
  courseName: string;
  classStatus: ClassStatus;
  studentMembershipStatus: ClassStudentStatus | null;
  title: string;
  description: string | null;
  durationMinutes: number | null;
  maxAttempts: number;
  startAt: string | null;
  endAt: string | null;
  status: QuizStatus;
  maxScore: number;
  attemptCount: number;
  hasActiveAttempt: boolean;
}

export interface CreateQuizRequest {
  classId: number;
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  maxAttempts: number;
  startAt?: string | null;
  endAt?: string | null;
}

export interface UpdateQuizRequest {
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  maxAttempts: number;
  startAt?: string | null;
  endAt?: string | null;
}

export interface QuestionOptionResponse {
  id: number;
  questionId: number;
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionOptionRequest {
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface QuestionManagementResponse {
  id: number;
  quizId: number;
  content: string;
  questionType: QuestionType;
  correctTextAnswer: string | null;
  score: number;
  orderIndex: number;
  options: QuestionOptionResponse[];
}

export interface CreateQuestionRequest {
  content: string;
  questionType: QuestionType;
  correctTextAnswer?: string | null;
  score: number;
  orderIndex: number;
  options?: QuestionOptionRequest[] | null;
}

export interface UpdateQuestionRequest {
  content: string;
  questionType: QuestionType;
  correctTextAnswer?: string | null;
  score: number;
  orderIndex: number;
  options?: QuestionOptionRequest[] | null;
}

export interface StudentOptionResponse {
  id: number;
  content: string;
  orderIndex: number;
}

export interface StudentQuestionResponse {
  id: number;
  content: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  options: StudentOptionResponse[];
  selectedOptionId: number | null;
  textAnswer: string | null;
}

export interface StudentAttemptDetailResponse {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  attemptNumber: number;
  startedAt: string;
  durationMinutes: number | null;
  effectiveDeadline: string | null;
  status: QuizAttemptStatus;
  quizMaxScore: number;
  questions: StudentQuestionResponse[];
}

export interface SaveAnswerRequest {
  selectedOptionId?: number | null;
  textAnswer?: string | null;
}

export interface StudentAnswerResponse {
  questionId: number;
  selectedOptionId: number | null;
  textAnswer: string | null;
  savedAt: string;
}

export interface StudentSubmittedAnswerSummary {
  questionId: number;
  selectedOptionId: number | null;
  textAnswer: string | null;
}

export interface StudentOpenQuizResultResponse {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  totalScore: null;
  quizMaxScore: number;
  questionCount: number;
  submittedAnswers: StudentSubmittedAnswerSummary[];
}

export interface StudentQuestionReviewItem {
  questionId: number;
  content: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  selectedOptionId: number | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  scoreEarned: number;
  correctTextAnswer: string | null;
  options: QuestionOptionResponse[];
}

export interface StudentAttemptReviewResponse {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  totalScore: number;
  quizMaxScore: number;
  questions: StudentQuestionReviewItem[];
}

export interface StudentAttemptSummaryResponse {
  attemptId: number;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
}

export interface QuizAttemptListItemResponse {
  attemptId: number;
  quizId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  quizMaxScore: number;
}

export interface ManagementQuestionReviewItem {
  questionId: number;
  content: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  selectedOptionId: number | null;
  textAnswer: string | null;
  isCorrect: boolean | null;
  scoreEarned: number;
  correctTextAnswer: string | null;
  options: QuestionOptionResponse[];
}

export interface ManagementAttemptDetailResponse {
  attemptId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  quizId: number;
  quizTitle: string;
  classId: number;
  classCode: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  quizMaxScore: number;
  questions: ManagementQuestionReviewItem[];
}

export interface TeacherQuizClassLookupItemResponse {
  classId: number;
  classCode: string;
  courseName: string;
  status: ClassStatus;
  startDate: string;
  endDate: string;
  quizCount: number;
}

export interface QuizQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  classId?: number;
  status?: QuizStatus | string;
  fromDate?: string;
  toDate?: string;
}

export interface QuizAttemptQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  studentId?: number;
  status?: QuizAttemptStatus | string;
}

export interface TeacherQuizClassLookupParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// ==================================================
// AI QUIZ TYPES
// ==================================================

export type QuizAiSourceType = 'Topic' | 'Lesson';

export type QuizAiDifficulty = 'Easy' | 'Medium' | 'Hard';

export type QuizAiLanguage = 'English' | 'Vietnamese';

export interface GenerateQuizQuestionsRequest {
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

export interface GeneratedQuizOptionItemResponse {
  content: string;
  isCorrect: boolean;
  orderIndex: number;
}

export interface GeneratedQuizQuestionItemResponse {
  tempId: string;
  content: string;
  questionType: QuestionType;
  score: number;
  orderIndex: number;
  options: GeneratedQuizOptionItemResponse[];
  correctTextAnswer: string | null;
  explanation: string | null;
}

export interface GeneratedQuizQuestionsResponse {
  quizId: number;
  sourceType: QuizAiSourceType;
  sourceSummary: string;
  questions: GeneratedQuizQuestionItemResponse[];
  warnings: string[];
}

export interface ApplyGeneratedOptionItemRequest {
  content: string;
  isCorrect: boolean;
}

export interface ApplyGeneratedQuestionItemRequest {
  content: string;
  questionType: QuestionType;
  score: number;
  correctTextAnswer?: string | null;
  options?: ApplyGeneratedOptionItemRequest[] | null;
}

export interface ApplyGeneratedQuestionsRequest {
  questions: ApplyGeneratedQuestionItemRequest[];
}
