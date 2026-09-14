using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Schedules;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class ScheduleRepository : IScheduleRepository
{
    private readonly AppDbContext _context;

    public ScheduleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ScheduleListItemResponse>> GetPagedAsync(ScheduleQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Schedules
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across ClassCode, CourseName, RoomCode, RoomName, Teacher FullName
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(s =>
                s.Class.ClassCode.Contains(search) ||
                s.Class.Course.CourseName.Contains(search) ||
                s.Room.RoomCode.Contains(search) ||
                (s.Room.RoomName != null && s.Room.RoomName.Contains(search)) ||
                (s.Class.Teacher != null && s.Class.Teacher.User.FullName.Contains(search)));
        }

        // 2. Exact filter by ClassId
        if (query.ClassId.HasValue)
        {
            queryable = queryable.Where(s => s.ClassId == query.ClassId.Value);
        }

        // 3. Exact filter by RoomId
        if (query.RoomId.HasValue)
        {
            queryable = queryable.Where(s => s.RoomId == query.RoomId.Value);
        }

        // 4. Exact filter by DayOfWeek
        if (query.DayOfWeek.HasValue)
        {
            queryable = queryable.Where(s => s.DayOfWeek == query.DayOfWeek.Value);
        }

        // 5. Exact filter by TeacherId
        if (query.TeacherId.HasValue)
        {
            queryable = queryable.Where(s => s.Class.TeacherId == query.TeacherId.Value);
        }

        // 6. Count total matching items
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 7. Apply sorting with canonical whitelist
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(s => s.Id) : queryable.OrderByDescending(s => s.Id),
            "classcode" => isAscending ? queryable.OrderBy(s => s.Class.ClassCode) : queryable.OrderByDescending(s => s.Class.ClassCode),
            "roomcode" => isAscending ? queryable.OrderBy(s => s.Room.RoomCode) : queryable.OrderByDescending(s => s.Room.RoomCode),
            "dayofweek" => isAscending ? queryable.OrderBy(s => s.DayOfWeek) : queryable.OrderByDescending(s => s.DayOfWeek),
            "starttime" => isAscending ? queryable.OrderBy(s => s.StartTime) : queryable.OrderByDescending(s => s.StartTime),
            "endtime" => isAscending ? queryable.OrderBy(s => s.EndTime) : queryable.OrderByDescending(s => s.EndTime),
            _ => queryable.OrderBy(s => s.DayOfWeek).ThenBy(s => s.StartTime) // Default fallback: weekly chronological
        };

        // 8. Pagination & direct projection
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new ScheduleListItemResponse
            {
                Id = s.Id,
                ClassId = s.ClassId,
                ClassCode = s.Class.ClassCode,
                CourseName = s.Class.Course.CourseName,
                TeacherId = s.Class.TeacherId,
                TeacherName = s.Class.Teacher != null ? s.Class.Teacher.User.FullName : null,
                RoomId = s.RoomId,
                RoomCode = s.Room.RoomCode,
                RoomName = s.Room.RoomName,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ScheduleListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<ScheduleDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Schedules
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new ScheduleDetailResponse
            {
                Id = s.Id,
                ClassId = s.ClassId,
                ClassCode = s.Class.ClassCode,
                CourseName = s.Class.Course.CourseName,
                ClassStatus = s.Class.Status,
                ClassStartDate = s.Class.StartDate,
                ClassEndDate = s.Class.EndDate,
                TeacherId = s.Class.TeacherId,
                TeacherName = s.Class.Teacher != null ? s.Class.Teacher.User.FullName : null,
                RoomId = s.RoomId,
                RoomCode = s.Room.RoomCode,
                RoomName = s.Room.RoomName,
                RoomStatus = s.Room.Status,
                DayOfWeek = s.DayOfWeek,
                StartTime = s.StartTime,
                EndTime = s.EndTime
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Schedule?> GetByIdTrackedAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Schedules
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<CourseClass?> GetClassByIdAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
    }

    public async Task<Room?> GetRoomByIdAsync(int roomId, CancellationToken cancellationToken = default)
    {
        return await _context.Rooms
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == roomId, cancellationToken);
    }

    public async Task<bool> HasRoomConflictAsync(
        int roomId,
        int dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        DateTime classStartDate,
        DateTime classEndDate,
        int? excludeScheduleId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Schedules
            .AsNoTracking()
            .AnyAsync(s =>
                (excludeScheduleId == null || s.Id != excludeScheduleId) &&
                s.RoomId == roomId &&
                s.DayOfWeek == dayOfWeek &&
                s.StartTime < endTime &&
                s.EndTime > startTime &&
                classStartDate <= s.Class.EndDate &&
                s.Class.StartDate <= classEndDate,
                cancellationToken);
    }

    public async Task<bool> HasClassConflictAsync(
        int classId,
        int dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        int? excludeScheduleId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Schedules
            .AsNoTracking()
            .AnyAsync(s =>
                (excludeScheduleId == null || s.Id != excludeScheduleId) &&
                s.ClassId == classId &&
                s.DayOfWeek == dayOfWeek &&
                s.StartTime < endTime &&
                s.EndTime > startTime,
                cancellationToken);
    }

    public async Task<bool> HasTeacherConflictAsync(
        int teacherId,
        int dayOfWeek,
        TimeSpan startTime,
        TimeSpan endTime,
        DateTime classStartDate,
        DateTime classEndDate,
        int? excludeScheduleId = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Schedules
            .AsNoTracking()
            .AnyAsync(s =>
                (excludeScheduleId == null || s.Id != excludeScheduleId) &&
                s.Class.TeacherId == teacherId &&
                s.DayOfWeek == dayOfWeek &&
                s.StartTime < endTime &&
                s.EndTime > startTime &&
                classStartDate <= s.Class.EndDate &&
                s.Class.StartDate <= classEndDate,
                cancellationToken);
    }

    public async Task AddAsync(Schedule schedule, CancellationToken cancellationToken = default)
    {
        await _context.Schedules.AddAsync(schedule, cancellationToken);
    }

    public void Remove(Schedule schedule)
    {
        _context.Schedules.Remove(schedule);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
