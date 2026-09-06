import type { ManagementQueryParams } from './common.types';

export type TeacherStatus = 'Active' | 'Inactive';

export interface TeacherListItem {
  id: number;
  teacherCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  specialization: string;
  qualification: string | null;
  experienceYears: number;
  hireDate: string;
  status: TeacherStatus;
  isActive: boolean;
}

export interface TeacherDetail {
  id: number;
  teacherCode: string;
  userId: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roles: string[];
  specialization: string;
  qualification: string | null;
  experienceYears: number;
  hireDate: string;
  status: TeacherStatus;
}

export interface CreateTeacherPayload {
  teacherCode: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  specialization: string;
  qualification?: string | null;
  experienceYears: number;
  hireDate: string;
}

export interface UpdateTeacherPayload {
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  specialization: string;
  qualification?: string | null;
  experienceYears: number;
  hireDate: string;
}

export interface UpdateTeacherStatusPayload {
  status: TeacherStatus;
}

export interface TeacherFilterParams extends ManagementQueryParams {
  status?: TeacherStatus;
  specialization?: string;
}
