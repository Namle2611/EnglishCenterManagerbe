import type { ClassStatus } from './class.types';
import type { ClassStudentStatus } from './assignment.types';
import type { PagedResult } from './common.types';

export type GradeSourceType = 'Assignment' | 'Quiz';

export type GradeItemStatus = 'Missing' | 'InProgress' | 'Ungraded' | 'Graded' | 'Locked';

export interface GradeItemResponse {
  sourceType: GradeSourceType;
  sourceId: number;
  submissionId: number | null;
  title: string;
  status: GradeItemStatus;
  sourceStatus?: string | null;
  rawScore: number | null;
  maxScore: number;
  percentage: number | null;
  dueDate?: string | null;
  submittedAt?: string | null;
  feedback?: string | null;
}

export interface GradeReportingSummaryResponse {
  visibleGradedItemCount: number;
  pendingItemCount: number;
  visibleEarnedPoints: number;
  visiblePossiblePoints: number;
  visiblePercentage: number | null;
}

export interface GradeStudentRosterItemResponse {
  studentId: number;
  studentCode: string;
  studentName: string;
  membershipStatus: ClassStudentStatus;
  summary: GradeReportingSummaryResponse;
  items: GradeItemResponse[];
}

export interface ClassGradebookResponse {
  classId: number;
  classCode: string;
  courseName: string;
  teacherName: string;
  classStatus: ClassStatus;
  roster: PagedResult<GradeStudentRosterItemResponse>;
}

export interface StudentClassGradeDetailResponse {
  classId: number;
  classCode: string;
  courseName: string;
  teacherName: string;
  classStatus: ClassStatus;
  studentId: number;
  studentCode: string;
  studentName: string;
  membershipStatus: ClassStudentStatus;
  summary: GradeReportingSummaryResponse;
  items: GradeItemResponse[];
}

export interface StudentGradeSummaryResponse {
  classId: number;
  classCode: string;
  courseName: string;
  teacherName: string;
  classStatus: ClassStatus;
  membershipStatus: ClassStudentStatus;
  summary: GradeReportingSummaryResponse;
}

export interface GradeQueryParams {
  search?: string;
  membershipStatus?: ClassStudentStatus;
  sortBy?: string;
  isAscending?: boolean;
  page?: number;
  pageSize?: number;
}

export interface GradeSubmissionPayload {
  score: number;
  feedback?: string | null;
}
