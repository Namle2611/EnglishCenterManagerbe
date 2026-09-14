import type { ManagementQueryParams } from './common.types';

export type EnrollmentStatus = 'Pending' | 'Confirmed' | 'Paid' | 'Enrolled' | 'Cancelled';

export interface EnrollmentListItem {
  id: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  classId?: number | null;
  classCode?: string | null;
  tuitionAmount: number;
  enrollmentDate: string;
  status: EnrollmentStatus;
  confirmedBy?: number | null;
  confirmedByName?: string | null;
  confirmedAt?: string | null;
}

export interface EnrollmentDetail {
  id: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentEmail?: string | null;
  studentPhone?: string | null;
  courseId: number;
  courseCode: string;
  courseName: string;
  courseTuitionFee: number;
  classId?: number | null;
  classCode?: string | null;
  classStatus?: string | null;
  classStudentStatus?: string | null;
  classJoinedAt?: string | null;
  tuitionAmount: number;
  enrollmentDate: string;
  status: EnrollmentStatus;
  confirmedBy?: number | null;
  confirmedByName?: string | null;
  confirmedAt?: string | null;
}

export interface CreateEnrollmentPayload {
  studentId: number;
  courseId: number;
  tuitionAmount?: number;
  enrollmentDate?: string;
}

export interface UpdateEnrollmentPayload {
  tuitionAmount: number;
}

export interface UpdateEnrollmentStatusPayload {
  status: EnrollmentStatus;
  classId?: number;
}

export interface EnrollmentFilterParams extends ManagementQueryParams {
  studentId?: number;
  courseId?: number;
  classId?: number;
  status?: EnrollmentStatus;
  dateFrom?: string;
  dateTo?: string;
}
