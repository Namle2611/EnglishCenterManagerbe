import type { ManagementQueryParams } from './common.types';
import type { ClassStatus } from './class.types';
import type { RoomStatus } from './room.types';

export interface ScheduleListItem {
  id: number;
  classId: number;
  classCode: string;
  courseName: string;
  teacherId: number | null;
  teacherName: string | null;
  roomId: number;
  roomCode: string;
  roomName: string | null;
  dayOfWeek: number; // 1 = Monday .. 7 = Sunday
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
}

export interface ScheduleDetail {
  id: number;
  classId: number;
  classCode: string;
  courseName: string;
  classStatus: ClassStatus;
  classStartDate: string; // ISO DateTime string
  classEndDate: string;   // ISO DateTime string
  teacherId: number | null;
  teacherName: string | null;
  roomId: number;
  roomCode: string;
  roomName: string | null;
  roomStatus: RoomStatus;
  dayOfWeek: number; // 1 = Monday .. 7 = Sunday
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
}

export interface CreateSchedulePayload {
  classId: number;
  roomId: number;
  dayOfWeek: number;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
}

export interface UpdateSchedulePayload {
  roomId: number;
  dayOfWeek: number;
  startTime: string; // "HH:mm:ss"
  endTime: string;   // "HH:mm:ss"
}

export interface ScheduleFilterParams extends ManagementQueryParams {
  classId?: number;
  roomId?: number;
  teacherId?: number;
  dayOfWeek?: number;
}
