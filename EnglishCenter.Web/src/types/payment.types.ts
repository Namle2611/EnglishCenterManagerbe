import type { ManagementQueryParams } from './common.types';
import type { EnrollmentStatus } from './enrollment.types';

export type PaymentStatus = 'Pending' | 'Completed' | 'Failed' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'Online';

export interface PaymentListItem {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  classId?: number | null;
  classCode?: string | null;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionCode?: string | null;
  status: PaymentStatus;
  note?: string | null;
}

export interface PaymentDetail {
  id: number;
  enrollmentId: number;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  classId?: number | null;
  classCode?: string | null;
  tuitionAmount: number;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionCode?: string | null;
  status: PaymentStatus;
  note?: string | null;
}

export interface PaymentSummary {
  enrollmentId: number;
  tuitionAmount: number;
  effectivePaidAmount: number;
  pendingPaidAmount: number;
  remainingAmount: number;
  isFullyPaid: boolean;
  completedPaymentCount: number;
  totalPaymentCount: number;
  enrollmentStatus: EnrollmentStatus;
}

export interface CreatePaymentPayload {
  enrollmentId: number;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: string;
  transactionCode?: string;
  note?: string;
}

export interface UpdatePaymentPayload {
  amount?: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  transactionCode?: string;
  note?: string;
}

export interface UpdatePaymentStatusPayload {
  status: PaymentStatus;
}

export interface PaymentFilterParams extends ManagementQueryParams {
  enrollmentId?: number;
  studentId?: number;
  courseId?: number;
  classId?: number;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}
