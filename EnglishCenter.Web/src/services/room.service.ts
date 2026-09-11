import { axiosClient } from '../api/axiosClient';
import type { ApiResponse, PagedResult } from '../types/common.types';
import type {
  CreateRoomPayload,
  RoomDetail,
  RoomFilterParams,
  RoomListItem,
  RoomStatus,
  UpdateRoomPayload,
  UpdateRoomStatusPayload
} from '../types/room.types';
import { buildRoomQueryParams } from '../utils/roomHelper';

export const roomService = {
  async getRooms(
    params: RoomFilterParams = {},
    signal?: AbortSignal
  ): Promise<ApiResponse<PagedResult<RoomListItem>>> {
    const queryParams = buildRoomQueryParams(params);
    const response = await axiosClient.get<ApiResponse<PagedResult<RoomListItem>>>('/rooms', {
      params: queryParams,
      signal
    });
    return response.data;
  },

  async getRoomById(id: number, signal?: AbortSignal): Promise<ApiResponse<RoomDetail>> {
    const response = await axiosClient.get<ApiResponse<RoomDetail>>(`/rooms/${id}`, {
      signal
    });
    return response.data;
  },

  async createRoom(payload: CreateRoomPayload): Promise<ApiResponse<RoomDetail>> {
    const response = await axiosClient.post<ApiResponse<RoomDetail>>('/rooms', payload);
    return response.data;
  },

  async updateRoom(id: number, payload: UpdateRoomPayload): Promise<ApiResponse<RoomDetail>> {
    const response = await axiosClient.put<ApiResponse<RoomDetail>>(`/rooms/${id}`, payload);
    return response.data;
  },

  async updateRoomStatus(id: number, status: RoomStatus): Promise<ApiResponse<RoomDetail>> {
    const payload: UpdateRoomStatusPayload = { status };
    const response = await axiosClient.patch<ApiResponse<RoomDetail>>(`/rooms/${id}/status`, payload);
    return response.data;
  }
};
