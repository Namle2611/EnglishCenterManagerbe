import type { ManagementQueryParams } from './common.types';

export type StudentStatus = 'Active' | 'Inactive' | 'Graduated' | 'Suspended';

export interface StudentListItem {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  currentLevel: string | null;
  enrollmentDate: string;
  status: StudentStatus;
  isActive: boolean;
}

export interface StudentDetail {
  id: number;
  studentCode: string;
  userId: number;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  roles: string[];
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  currentLevel: string | null;
  enrollmentDate: string;
  status: StudentStatus;
}

export interface CreateStudentPayload {
  studentCode: string;
  email: string;
  password: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  currentLevel?: string | null;
}

export interface UpdateStudentPayload {
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  currentLevel?: string | null;
}

export interface UpdateStudentStatusPayload {
  status: StudentStatus;
}

export interface StudentFilterParams extends ManagementQueryParams {
  status?: StudentStatus;
  currentLevel?: string;
}
