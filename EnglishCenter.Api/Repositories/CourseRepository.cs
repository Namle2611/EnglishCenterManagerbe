using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Courses;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class CourseRepository : ICourseRepository
{
    private readonly AppDbContext _context;

    public CourseRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<CourseListItemResponse>> GetPagedAsync(CourseQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Courses
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across CourseCode and CourseName (server-side, case-insensitive via SQL collation)
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(c =>
                c.CourseCode.Contains(search) ||
                c.CourseName.Contains(search));
        }

        // 2. Exact filter by Status
        if (query.Status.HasValue)
        {
            queryable = queryable.Where(c => c.Status == query.Status.Value);
        }

        // 3. Exact filter by Level
        if (!string.IsNullOrWhiteSpace(query.Level))
        {
            var level = query.Level.Trim();
            queryable = queryable.Where(c => c.Level == level);
        }

        // 4. Count total matching items
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 5. Apply sorting with documented camelCase whitelist
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(c => c.Id) : queryable.OrderByDescending(c => c.Id),
            "coursecode" => isAscending ? queryable.OrderBy(c => c.CourseCode) : queryable.OrderByDescending(c => c.CourseCode),
            "coursename" => isAscending ? queryable.OrderBy(c => c.CourseName) : queryable.OrderByDescending(c => c.CourseName),
            "level" => isAscending ? queryable.OrderBy(c => c.Level) : queryable.OrderByDescending(c => c.Level),
            "durationmonths" => isAscending ? queryable.OrderBy(c => c.DurationMonths) : queryable.OrderByDescending(c => c.DurationMonths),
            "tuitionfee" => isAscending ? queryable.OrderBy(c => c.TuitionFee) : queryable.OrderByDescending(c => c.TuitionFee),
            "status" => isAscending ? queryable.OrderBy(c => c.Status) : queryable.OrderByDescending(c => c.Status),
            _ => queryable.OrderByDescending(c => c.Id) // Default fallback sort
        };

        // 6. Pagination & direct projection (no entity tracking, no relationship graph loading)
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new CourseListItemResponse
            {
                Id = c.Id,
                CourseCode = c.CourseCode,
                CourseName = c.CourseName,
                Description = c.Description,
                Level = c.Level,
                DurationMonths = c.DurationMonths,
                TuitionFee = c.TuitionFee,
                Status = c.Status
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<CourseListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<Course?> GetByIdAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default)
    {
        var query = asNoTracking ? _context.Courses.AsNoTracking() : _context.Courses.AsQueryable();
        return await query.FirstOrDefaultAsync(c => c.Id == id, cancellationToken);
    }

    public async Task<bool> CourseCodeExistsAsync(string courseCode, CancellationToken cancellationToken = default)
    {
        var trimmed = courseCode.Trim();
        return await _context.Courses
            .AsNoTracking()
            .AnyAsync(c => c.CourseCode == trimmed, cancellationToken);
    }

    public async Task AddAsync(Course course, CancellationToken cancellationToken = default)
    {
        await _context.Courses.AddAsync(course, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
