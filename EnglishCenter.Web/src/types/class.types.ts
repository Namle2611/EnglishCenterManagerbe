import type { ManagementQueryParams } from './common.types';

export type ClassStatus = 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface ClassListItem {
  id: number;
  classCode: string;

  courseId: number;
  courseCode: string;
  courseName: string;

  teacherId: number | null;
  teacherCode: string | null;
  teacherName: string | null;

  startDate: string;
  endDate: string;

  maxStudents: number;
  status: ClassStatus;
}

export interface ClassDetail {
  id: number;
  classCode: string;

  courseId: number;
  courseCode: string;
  courseName: string;

  teacherId: number | null;
  teacherCode: string | null;
  teacherName: string | null;

  startDate: string;
  endDate: string;

  maxStudents: number;
  status: ClassStatus;
}

export interface CreateClassPayload {
  classCode: string;
  courseId: number;
  teacherId: number | null;
  startDate: string;
  endDate: string;
  maxStudents: number;
}

export interface UpdateClassPayload {
  courseId: number;
  teacherId: number | null;
  startDate: string;
  endDate: string;
  maxStudents: number;
}

export interface UpdateClassStatusPayload {
  status: ClassStatus;
}

export interface TeacherLookupItem {
  id: number;
  teacherCode: string;
  fullName: string;
  specialization: string;
  status: 'Active' | 'Inactive';
}

export interface ClassFilterParams extends ManagementQueryParams {
  status?: ClassStatus;
  courseId?: number;
  teacherId?: number;
}
