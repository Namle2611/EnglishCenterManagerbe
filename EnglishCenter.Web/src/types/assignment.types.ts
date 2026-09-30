import type { PaginationParams } from './common.types';

export type AssignmentStatus = 'Draft' | 'Published' | 'Closed';

export type ClassStatus = 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled';

export type ClassStudentStatus = 'Active' | 'Completed' | 'Withdrawn';

export interface AssignmentListItem {
  id: number;
  classId: number;
  classCode: string;
  courseName: string;
  teacherId: number;
  teacherName: string;
  title: string;
  deadline: string;
  maxScore: number;
  status: AssignmentStatus;
  submissionCount: number;
  hasSubmitted: boolean;
  studentMembershipStatus: ClassStudentStatus | null;
}

export interface AssignmentDetail extends AssignmentListItem {
  description: string | null;
  attachmentUrl: string | null;
  classStatus: ClassStatus;
}

export interface SubmissionListItem {
  id: number;
  assignmentId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  fileUrl: string | null;
  content: string | null;
  submittedAt: string;
  isLate: boolean;
  score: number | null;
  feedback: string | null;
  isGraded: boolean;
}

export interface SubmissionDetail extends SubmissionListItem {
  assignmentTitle: string;
  deadline: string;
  maxScore: number;
}

export interface CreateAssignmentPayload {
  classId: number;
  title: string;
  description: string | null;
  attachmentUrl: string | null;
  deadline: string;
  maxScore: number;
  status: AssignmentStatus;
}

export interface UpdateAssignmentPayload {
  title: string;
  description: string | null;
  attachmentUrl: string | null;
  deadline: string;
  maxScore: number;
  status: AssignmentStatus;
}

export interface CreateSubmissionPayload {
  fileUrl: string | null;
  content: string | null;
}

export interface UpdateSubmissionPayload {
  fileUrl: string | null;
  content: string | null;
}

export interface AssignmentClassLookupItem {
  classId: number;
  classCode: string;
  courseName: string;
  status: ClassStatus;
  startDate?: string;
  endDate?: string;
  id?: number;
  className?: string;
}

export interface AssignmentClassLookupParams extends PaginationParams {
  search?: string;
  classId?: number;
  status?: ClassStatus | string;
}

export interface AssignmentQueryParams extends PaginationParams {
  classId?: number;
  status?: AssignmentStatus;
  dueFrom?: string;
  dueTo?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface StudentAssignmentQueryParams extends PaginationParams {
  status?: AssignmentStatus;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SubmissionQueryParams extends PaginationParams {
  search?: string;
  studentId?: number;
  isLate?: boolean;
  isGraded?: boolean;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
