import type { ManagementQueryParams } from './common.types';

export type RoomStatus = 'Active' | 'Inactive' | 'Maintenance';

export interface RoomListItem {
  id: number;
  roomCode: string;
  roomName: string | null;
  capacity: number;
  status: RoomStatus;
}

export interface RoomDetail {
  id: number;
  roomCode: string;
  roomName: string | null;
  capacity: number;
  status: RoomStatus;
}

export interface CreateRoomPayload {
  roomCode: string;
  roomName: string | null;
  capacity: number;
}

export interface UpdateRoomPayload {
  roomName: string | null;
  capacity: number;
}

export interface UpdateRoomStatusPayload {
  status: RoomStatus;
}

export interface RoomFilterParams extends ManagementQueryParams {
  status?: RoomStatus;
}
