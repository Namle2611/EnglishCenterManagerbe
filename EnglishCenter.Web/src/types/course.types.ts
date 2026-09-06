import type { ManagementQueryParams } from './common.types';

export type CourseStatus = 'Active' | 'Inactive';

export interface CourseListItem {
  id: number;
  courseCode: string;
  courseName: string;
  description: string | null;
  level: string | null;
  durationMonths: number;
  tuitionFee: number;
  status: CourseStatus;
}

export interface CourseDetail {
  id: number;
  courseCode: string;
  courseName: string;
  description: string | null;
  level: string | null;
  durationMonths: number;
  tuitionFee: number;
  status: CourseStatus;
}

export interface CreateCoursePayload {
  courseCode: string;
  courseName: string;
  description?: string | null;
  level?: string | null;
  durationMonths: number;
  tuitionFee: string;
}

export interface UpdateCoursePayload {
  courseName: string;
  description?: string | null;
  level?: string | null;
  durationMonths: number;
  tuitionFee: string;
}

export interface UpdateCourseStatusPayload {
  status: CourseStatus;
}

export interface CourseFilterParams extends ManagementQueryParams {
  status?: CourseStatus;
  level?: string;
}
