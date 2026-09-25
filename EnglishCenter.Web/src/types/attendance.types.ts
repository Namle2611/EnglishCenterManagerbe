import type { ManagementQueryParams } from './common.types';

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';
export type ClassStudentStatus = 'Active' | 'Completed' | 'Withdrawn';
export type ClassStatus = 'Planned' | 'Ongoing' | 'Completed' | 'Cancelled';

export interface AttendanceListItem {
  id: number;
  sessionDate: string;
  startTime: string;
  classId: number;
  classCode: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  status: AttendanceStatus;
  note?: string | null;
}

export interface AttendanceDetail {
  id: number;
  sessionDate: string;
  startTime: string;
  classId: number;
  classCode: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  studentId: number;
  studentCode: string;
  studentName: string;
  studentEmail: string;
  teacherId?: number | null;
  teacherCode?: string | null;
  teacherName?: string | null;
  status: AttendanceStatus;
  note?: string | null;
  classStudentStatus?: ClassStudentStatus | null;
  createdAt: string;
}

export interface AttendanceRosterItem {
  studentId: number;
  studentCode: string;
  studentName: string;
  membershipStatus: ClassStudentStatus;
  joinedAt: string;
  canCreate: boolean;
  ineligibilityReason?: string | null;
  attendanceId?: number | null;
  status?: AttendanceStatus | null;
  note?: string | null;
}

export interface AttendanceSessionRoster {
  attendanceSessionId?: number | null;
  classId: number;
  classCode: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  teacherId?: number | null;
  teacherCode?: string | null;
  teacherName?: string | null;
  sessionDate: string;
  startTime: string;
  isExistingSession?: boolean;
  students: AttendanceRosterItem[];
}

export interface TeacherClassScheduleItem {
  scheduleId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomId: number;
  roomCode: string;
  roomName?: string | null;
}

export interface TeacherClassLookupItem {
  classId: number;
  classCode: string;
  courseId: number;
  courseCode: string;
  courseName: string;
  status: ClassStatus;
  startDate: string;
  endDate: string;
  maxStudents: number;
  enrolledStudentCount: number;
  schedules: TeacherClassScheduleItem[];
}

export interface AttendanceQueryParams extends ManagementQueryParams {
  classId?: number | null;
  studentId?: number | null;
  courseId?: number | null;
  teacherId?: number | null;
  status?: AttendanceStatus | null;
  dateFrom?: string | null;
  dateTo?: string | null;
}

export interface TeacherClassLookupParams extends ManagementQueryParams {
  classId?: number | null;
  status?: ClassStatus | null;
}

export interface CreateAttendancePayload {
  classId: number;
  sessionDate: string;
  startTime: string;
  studentId: number;
  status: AttendanceStatus;
  note?: string | null;
}

export interface UpdateAttendancePayload {
  status: AttendanceStatus;
  note?: string | null;
}

export interface BulkAttendanceItem {
  studentId: number;
  status: AttendanceStatus;
  note?: string | null;
}

export interface BulkUpsertAttendancePayload {
  classId: number;
  sessionDate: string;
  startTime: string;
  records: BulkAttendanceItem[];
}

// UI-only dirty-state row representation for the session roster
export interface RosterDirtyState {
  status: AttendanceStatus | null;
  note: string;
  isDirty: boolean;
}
