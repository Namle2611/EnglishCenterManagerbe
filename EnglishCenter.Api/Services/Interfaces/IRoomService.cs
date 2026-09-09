using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Rooms;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IRoomService
{
    Task<PagedResult<RoomListItemResponse>> GetListAsync(RoomQuery query, CancellationToken cancellationToken = default);
    Task<RoomDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<RoomDetailResponse> CreateAsync(CreateRoomRequest request, CancellationToken cancellationToken = default);
    Task<RoomDetailResponse> UpdateAsync(int id, UpdateRoomRequest request, CancellationToken cancellationToken = default);
    Task<RoomDetailResponse> UpdateStatusAsync(int id, UpdateRoomStatusRequest request, CancellationToken cancellationToken = default);
}
