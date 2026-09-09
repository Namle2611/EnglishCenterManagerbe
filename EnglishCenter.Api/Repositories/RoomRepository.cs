using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Rooms;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class RoomRepository : IRoomRepository
{
    private readonly AppDbContext _context;

    public RoomRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<RoomListItemResponse>> GetPagedAsync(RoomQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Rooms
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across RoomCode and RoomName (server-side, case-insensitive via SQL Server collation)
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(r =>
                r.RoomCode.Contains(search) ||
                (r.RoomName != null && r.RoomName.Contains(search)));
        }

        // 2. Exact filter by Status
        if (query.ParsedStatus.HasValue)
        {
            queryable = queryable.Where(r => r.Status == query.ParsedStatus.Value);
        }

        // 3. Count total matching items
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 4. Apply sorting with canonical whitelist
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(r => r.Id) : queryable.OrderByDescending(r => r.Id),
            "roomcode" => isAscending ? queryable.OrderBy(r => r.RoomCode) : queryable.OrderByDescending(r => r.RoomCode),
            "roomname" => isAscending ? queryable.OrderBy(r => r.RoomName) : queryable.OrderByDescending(r => r.RoomName),
            "capacity" => isAscending ? queryable.OrderBy(r => r.Capacity) : queryable.OrderByDescending(r => r.Capacity),
            "status" => isAscending ? queryable.OrderBy(r => r.Status) : queryable.OrderByDescending(r => r.Status),
            _ => queryable.OrderByDescending(r => r.Id) // Default fallback sort
        };

        // 5. Pagination & direct projection (no entity tracking, no relationship graph loading)
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RoomListItemResponse
            {
                Id = r.Id,
                RoomCode = r.RoomCode,
                RoomName = r.RoomName,
                Capacity = r.Capacity,
                Status = r.Status
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<RoomListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<RoomDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Rooms
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new RoomDetailResponse
            {
                Id = r.Id,
                RoomCode = r.RoomCode,
                RoomName = r.RoomName,
                Capacity = r.Capacity,
                Status = r.Status
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Room?> GetByIdTrackedAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Rooms
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<bool> RoomCodeExistsAsync(string roomCode, CancellationToken cancellationToken = default)
    {
        var trimmed = roomCode.Trim();
        return await _context.Rooms
            .AnyAsync(r => r.RoomCode == trimmed, cancellationToken);
    }

    public async Task AddAsync(Room room, CancellationToken cancellationToken = default)
    {
        await _context.Rooms.AddAsync(room, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
