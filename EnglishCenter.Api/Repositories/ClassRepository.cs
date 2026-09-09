using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Classes;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class ClassRepository : IClassRepository
{
    private readonly AppDbContext _context;

    public ClassRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<ClassListItemResponse>> GetPagedAsync(ClassQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Classes
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across ClassCode, CourseName, and Teacher FullName (server-side)
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(c =>
                c.ClassCode.Contains(search) ||
                c.Course.CourseName.Contains(search) ||
                (c.Teacher != null && c.Teacher.User.FullName.Contains(search)));
        }

        // 2. Exact filter by Status
        if (query.ParsedStatus.HasValue)
        {
            queryable = queryable.Where(c => c.Status == query.ParsedStatus.Value);
        }

        // 3. Exact filter by CourseId
        if (query.CourseId.HasValue)
        {
            queryable = queryable.Where(c => c.CourseId == query.CourseId.Value);
        }

        // 4. Exact filter by TeacherId
        if (query.TeacherId.HasValue)
        {
            queryable = queryable.Where(c => c.TeacherId == query.TeacherId.Value);
        }

        // 5. Count total matching items
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 6. Apply sorting with canonical whitelist
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(c => c.Id) : queryable.OrderByDescending(c => c.Id),
            "classcode" => isAscending ? queryable.OrderBy(c => c.ClassCode) : queryable.OrderByDescending(c => c.ClassCode),
            "startdate" => isAscending ? queryable.OrderBy(c => c.StartDate) : queryable.OrderByDescending(c => c.StartDate),
            "enddate" => isAscending ? queryable.OrderBy(c => c.EndDate) : queryable.OrderByDescending(c => c.EndDate),
            "maxstudents" => isAscending ? queryable.OrderBy(c => c.MaxStudents) : queryable.OrderByDescending(c => c.MaxStudents),
            "status" => isAscending ? queryable.OrderBy(c => c.Status) : queryable.OrderByDescending(c => c.Status),
            "coursename" => isAscending ? queryable.OrderBy(c => c.Course.CourseName) : queryable.OrderByDescending(c => c.Course.CourseName),
            _ => queryable.OrderByDescending(c => c.Id) // Default fallback sort
        };

        // 7. Pagination & direct projection (no entity tracking, no relationship graph loading)
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new ClassListItemResponse
            {
                Id = c.Id,
                ClassCode = c.ClassCode,
                CourseId = c.CourseId,
                CourseCode = c.Course.CourseCode,
                CourseName = c.Course.CourseName,
                TeacherId = c.TeacherId,
                TeacherCode = c.Teacher != null ? c.Teacher.TeacherCode : null,
                TeacherName = c.Teacher != null ? c.Teacher.User.FullName : null,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                MaxStudents = c.MaxStudents,
                Status = c.Status
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<ClassListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<ClassDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new ClassDetailResponse
            {
                Id = c.Id,
                ClassCode = c.ClassCode,
                CourseId = c.CourseId,
                CourseCode = c.Course.CourseCode,
                CourseName = c.Course.CourseName,
                TeacherId = c.TeacherId,
                TeacherCode = c.Teacher != null ? c.Teacher.TeacherCode : null,
                TeacherName = c.Teacher != null ? c.Teacher.User.FullName : null,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                MaxStudents = c.MaxStudents,
                Status = c.Status
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<CourseClass?> GetByIdTrackedAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<bool> ClassCodeExistsAsync(string classCode, CancellationToken cancellationToken = default)
    {
        var trimmed = classCode.Trim();
        return await _context.Classes
            .AsNoTracking()
            .AnyAsync(c => c.ClassCode == trimmed, cancellationToken);
    }

    public async Task<bool> CourseExistsAsync(int courseId, CancellationToken cancellationToken = default)
    {
        return await _context.Courses
            .AsNoTracking()
            .AnyAsync(co => co.Id == courseId, cancellationToken);
    }

    public async Task<bool> TeacherExistsAsync(int teacherId, CancellationToken cancellationToken = default)
    {
        return await _context.Teachers
            .AsNoTracking()
            .AnyAsync(t => t.Id == teacherId, cancellationToken);
    }

    public async Task AddAsync(CourseClass courseClass, CancellationToken cancellationToken = default)
    {
        await _context.Classes.AddAsync(courseClass, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
