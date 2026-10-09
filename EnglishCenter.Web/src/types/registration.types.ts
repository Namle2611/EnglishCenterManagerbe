export type RegistrationRole = 'STUDENT' | 'TEACHER' | 'STAFF';

export type RegistrationStatus =
  | 'PendingEmailVerification'
  | 'PendingApproval'
  | 'Completed'
  | 'Rejected';

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  requestedRole: RegistrationRole;
  // Teacher
  specialization?: string;
  qualification?: string;
  experienceYears?: number;
  // Student
  dateOfBirth?: string;
  gender?: string;
  address?: string;
}

export interface RegisterResponse {
  email: string;
  requestedRole: string;
  status: string;
  message: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  isPendingApproval: boolean;
  message: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface AdminRegistrationRequestDto {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  requestedRole: string;
  status: RegistrationStatus;
  emailVerifiedAt: string | null;
  specialization: string | null;
  qualification: string | null;
  experienceYears: number | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string | null;
  reviewedByUserId: number | null;
  reviewedByAdminName: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface ApproveRegistrationRequest {
  teacherCode?: string;
  hireDate?: string;
}

export interface RejectRegistrationRequest {
  reason?: string;
}

export interface RegistrationRequestQuery {
  status?: RegistrationStatus;
  role?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}
