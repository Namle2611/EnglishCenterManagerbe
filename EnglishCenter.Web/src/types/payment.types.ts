import type { ManagementQueryParams } from './common.types';
import type { EnrollmentStatus } from './enrollment.types';

export type PaymentStatus = 'Pending' | 'Completed' | 'Paid' | 'Failed' | 'Cancelled';
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'Online' | 'SePay';

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
  paymentCode?: string | null;
  paidAt?: string | null;
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
  paymentCode?: string | null;
  sePayTransactionId?: number | null;
  sePayReferenceCode?: string | null;
  receivedAmount?: number | null;
  paidAt?: string | null;
  createdAt?: string;
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

export interface SePayPaymentDetail {
  paymentId: number;
  enrollmentId: number;
  paymentCode: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrUrl: string;
  status: string;
  createdAt: string;
  paidAt?: string | null;
  courseName: string;
  classCode?: string | null;
  studentName: string;
  studentCode: string;
}

export interface PaymentStatusResponse {
  paymentId: number;
  status: string;
  paidAt?: string | null;
  amount: number;
  paymentCode?: string | null;
}

export interface StudentTuitionEnrollment {
  enrollmentId: number;
  courseId: number;
  courseCode: string;
  courseName: string;
  classId?: number | null;
  classCode?: string | null;
  tuitionAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: EnrollmentStatus;
  isFullyPaid: boolean;
  activePayment?: SePayPaymentDetail | null;
}
