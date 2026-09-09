using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Rooms;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;

namespace EnglishCenter.Api.Services;

public class RoomService : IRoomService
{
    private readonly IRoomRepository _roomRepository;
    private readonly ILogger<RoomService> _logger;

    public RoomService(
        IRoomRepository roomRepository,
        ILogger<RoomService> logger)
    {
        _roomRepository = roomRepository;
        _logger = logger;
    }

    public async Task<PagedResult<RoomListItemResponse>> GetListAsync(RoomQuery query, CancellationToken cancellationToken = default)
    {
        return await _roomRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<RoomDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var roomDetail = await _roomRepository.GetDetailByIdAsync(id, cancellationToken);
        if (roomDetail == null)
        {
            throw new NotFoundException($"Room with ID {id} not found.");
        }

        return roomDetail;
    }

    public async Task<RoomDetailResponse> CreateAsync(CreateRoomRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var roomCode = request.RoomCode?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(roomCode))
        {
            throw new ValidationException("RoomCode is required.");
        }

        if (roomCode.Length > 30)
        {
            throw new ValidationException("RoomCode cannot exceed 30 characters.");
        }

        // Check duplicate RoomCode (case-insensitive via SQL Server collation)
        if (await _roomRepository.RoomCodeExistsAsync(roomCode, cancellationToken))
        {
            throw new ConflictException($"Room with code '{roomCode}' already exists.");
        }

        var roomName = string.IsNullOrWhiteSpace(request.RoomName) ? null : request.RoomName.Trim();
        if (roomName != null && roomName.Length > 100)
        {
            throw new ValidationException("RoomName cannot exceed 100 characters.");
        }

        if (!request.Capacity.HasValue || request.Capacity.Value <= 0)
        {
            throw new ValidationException("Capacity must be greater than 0.");
        }

        var room = new Room
        {
            RoomCode = roomCode,
            RoomName = roomName,
            Capacity = request.Capacity.Value,
            Status = RoomStatus.Active // Approved canonical default: Status = Active
        };

        // Single-row write using EF Core atomic SaveChangesAsync, no explicit transaction required
        await _roomRepository.AddAsync(room, cancellationToken);
        await _roomRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Room '{RoomCode}' (ID: {RoomId}) created successfully with status Active.", room.RoomCode, room.Id);

        var result = await _roomRepository.GetDetailByIdAsync(room.Id, cancellationToken);
        return result!;
    }

    public async Task<RoomDetailResponse> UpdateAsync(int id, UpdateRoomRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var room = await _roomRepository.GetByIdTrackedAsync(id, cancellationToken);
        if (room == null)
        {
            throw new NotFoundException($"Room with ID {id} not found.");
        }

        var roomName = string.IsNullOrWhiteSpace(request.RoomName) ? null : request.RoomName.Trim();
        if (roomName != null && roomName.Length > 100)
        {
            throw new ValidationException("RoomName cannot exceed 100 characters.");
        }

        if (!request.Capacity.HasValue || request.Capacity.Value <= 0)
        {
            throw new ValidationException("Capacity must be greater than 0.");
        }

        // Update mutable scalar fields only; RoomCode and Status remain untouched
        room.RoomName = roomName;
        room.Capacity = request.Capacity.Value;

        // Single-row update using EF Core atomic SaveChangesAsync, no explicit transaction required
        await _roomRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Room '{RoomCode}' (ID: {RoomId}) updated successfully.", room.RoomCode, room.Id);

        var result = await _roomRepository.GetDetailByIdAsync(id, cancellationToken);
        return result!;
    }

    public async Task<RoomDetailResponse> UpdateStatusAsync(int id, UpdateRoomStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.Status.HasValue || !Enum.IsDefined(typeof(RoomStatus), request.Status.Value))
        {
            throw new ValidationException("Invalid room status.");
        }

        var room = await _roomRepository.GetByIdTrackedAsync(id, cancellationToken);
        if (room == null)
        {
            throw new NotFoundException($"Room with ID {id} not found.");
        }

        var newStatus = request.Status.Value;

        // Idempotent check: if status is unchanged, return current detail without redundant DB write
        if (room.Status == newStatus)
        {
            var current = await _roomRepository.GetDetailByIdAsync(id, cancellationToken);
            return current!;
        }

        room.Status = newStatus;
        await _roomRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Room '{RoomCode}' (ID: {RoomId}) status updated to {Status}.", room.RoomCode, room.Id, newStatus);

        var result = await _roomRepository.GetDetailByIdAsync(id, cancellationToken);
        return result!;
    }
}
