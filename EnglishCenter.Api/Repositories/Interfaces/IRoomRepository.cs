using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Rooms;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IRoomRepository
{
    Task<PagedResult<RoomListItemResponse>> GetPagedAsync(RoomQuery query, CancellationToken cancellationToken = default);
    Task<RoomDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Room?> GetByIdTrackedAsync(int id, CancellationToken cancellationToken = default);
    Task<bool> RoomCodeExistsAsync(string roomCode, CancellationToken cancellationToken = default);
    Task AddAsync(Room room, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
