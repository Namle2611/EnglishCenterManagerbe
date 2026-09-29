using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Sections;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class SectionRepository : ISectionRepository
{
    private readonly AppDbContext _context;

    public SectionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<SectionListItemResponse>> GetPagedAsync(
        SectionQuery query,
        List<int>? allowedCourseIds,
        CancellationToken cancellationToken = default)
    {
        var queryable = _context.Sections.AsNoTracking().AsQueryable();

        if (allowedCourseIds != null)
        {
            queryable = queryable.Where(s => allowedCourseIds.Contains(s.CourseId));
        }

        if (query.CourseId.HasValue)
        {
            queryable = queryable.Where(s => s.CourseId == query.CourseId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            queryable = queryable.Where(s => s.Title.ToLower().Contains(search) ||
                                            (s.Description != null && s.Description.ToLower().Contains(search)));
        }

        var totalItems = await queryable.CountAsync(cancellationToken);

        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        queryable = sortBy switch
        {
            "title" => query.IsAscending
                ? queryable.OrderBy(s => s.Title).ThenBy(s => s.Id)
                : queryable.OrderByDescending(s => s.Title).ThenByDescending(s => s.Id),
            "id" => query.IsAscending
                ? queryable.OrderBy(s => s.Id)
                : queryable.OrderByDescending(s => s.Id),
            _ => query.IsAscending
                ? queryable.OrderBy(s => s.OrderIndex).ThenBy(s => s.Id)
                : queryable.OrderByDescending(s => s.OrderIndex).ThenByDescending(s => s.Id)
        };

        var page = query.Page;
        var pageSize = query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new SectionListItemResponse
            {
                Id = s.Id,
                CourseId = s.CourseId,
                CourseCode = s.Course.CourseCode,
                CourseName = s.Course.CourseName,
                Title = s.Title,
                Description = s.Description,
                OrderIndex = s.OrderIndex,
                LessonCount = s.Lessons.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<SectionListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<Section?> GetByIdAsync(
        int id,
        bool asNoTracking = true,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Sections.AsQueryable();
        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        return await query
            .Include(s => s.Course)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<SectionDetailResponse?> GetDetailByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Sections
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new SectionDetailResponse
            {
                Id = s.Id,
                CourseId = s.CourseId,
                CourseCode = s.Course.CourseCode,
                CourseName = s.Course.CourseName,
                Title = s.Title,
                Description = s.Description,
                OrderIndex = s.OrderIndex,
                LessonCount = s.Lessons.Count
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Course?> GetCourseWithSyllabusAsync(
        int courseId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Courses
            .AsNoTracking()
            .Include(c => c.Sections.OrderBy(s => s.OrderIndex).ThenBy(s => s.Id))
                .ThenInclude(s => s.Lessons.OrderBy(l => l.OrderIndex).ThenBy(l => l.Id))
            .FirstOrDefaultAsync(c => c.Id == courseId, cancellationToken);
    }

    public async Task<bool> CourseExistsAsync(
        int courseId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Courses.AnyAsync(c => c.Id == courseId, cancellationToken);
    }

    public async Task<bool> TitleExistsAsync(
        int courseId,
        string normalizedTitle,
        int? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Sections.Where(s => s.CourseId == courseId);
        if (excludeId.HasValue)
        {
            query = query.Where(s => s.Id != excludeId.Value);
        }

        return await query.AnyAsync(s => s.Title.ToLower() == normalizedTitle, cancellationToken);
    }

    public async Task<int> GetMaxOrderIndexAsync(
        int courseId,
        CancellationToken cancellationToken = default)
    {
        var max = await _context.Sections
            .Where(s => s.CourseId == courseId)
            .Select(s => (int?)s.OrderIndex)
            .MaxAsync(cancellationToken);

        return max ?? -1;
    }

    public async Task<bool> HasLessonsAsync(
        int sectionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Lessons.AnyAsync(l => l.SectionId == sectionId, cancellationToken);
    }

    public async Task<List<int>> GetTeacherAuthorizedCourseIdsAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .AsNoTracking()
            .Where(c => c.Teacher != null &&
                        c.Teacher.UserId == userId &&
                        c.Teacher.Status == TeacherStatus.Active &&
                        c.Teacher.User.IsActive &&
                        c.Status != ClassStatus.Cancelled)
            .Select(c => c.CourseId)
            .Distinct()
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> IsTeacherAuthorizedForCourseAsync(
        int userId,
        int courseId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .AsNoTracking()
            .AnyAsync(c => c.CourseId == courseId &&
                           c.Teacher != null &&
                           c.Teacher.UserId == userId &&
                           c.Teacher.Status == TeacherStatus.Active &&
                           c.Teacher.User.IsActive &&
                           c.Status != ClassStatus.Cancelled,
                      cancellationToken);
    }

    public async Task<bool> IsActiveTeacherAsync(
        int userId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Teachers
            .AsNoTracking()
            .AnyAsync(t => t.UserId == userId &&
                           t.Status == TeacherStatus.Active &&
                           t.User.IsActive,
                      cancellationToken);
    }

    public async Task<PagedResult<TeacherCourseLookupItemResponse>> GetTeacherCoursesLookupAsync(
        TeacherCourseLookupQuery query,
        int teacherUserId,
        CancellationToken cancellationToken = default)
    {
        var queryable = _context.Courses
            .AsNoTracking()
            .Where(course => course.Classes.Any(c =>
                c.Teacher != null &&
                c.Teacher.UserId == teacherUserId &&
                (c.Status == ClassStatus.Planned ||
                 c.Status == ClassStatus.Ongoing ||
                 c.Status == ClassStatus.Completed)));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            queryable = queryable.Where(c => c.CourseCode.ToLower().Contains(search) ||
                                             c.CourseName.ToLower().Contains(search));
        }

        var totalItems = await queryable.CountAsync(cancellationToken);

        IOrderedQueryable<Course> orderedQueryable;
        if (string.IsNullOrWhiteSpace(query.SortBy))
        {
            orderedQueryable = queryable.OrderBy(c => c.CourseName).ThenBy(c => c.Id);
        }
        else
        {
            var sortBy = query.SortBy.Trim().ToLowerInvariant();
            orderedQueryable = sortBy switch
            {
                "coursecode" => query.IsAscending
                    ? queryable.OrderBy(c => c.CourseCode).ThenBy(c => c.Id)
                    : queryable.OrderByDescending(c => c.CourseCode).ThenByDescending(c => c.Id),
                "id" => query.IsAscending
                    ? queryable.OrderBy(c => c.Id)
                    : queryable.OrderByDescending(c => c.Id),
                _ => query.IsAscending
                    ? queryable.OrderBy(c => c.CourseName).ThenBy(c => c.Id)
                    : queryable.OrderByDescending(c => c.CourseName).ThenByDescending(c => c.Id)
            };
        }

        var page = query.Page;
        var pageSize = query.PageSize;

        var items = await orderedQueryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(c => new TeacherCourseLookupItemResponse
            {
                CourseId = c.Id,
                CourseCode = c.CourseCode,
                CourseName = c.CourseName,
                Level = c.Level
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TeacherCourseLookupItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task AddAsync(Section section, CancellationToken cancellationToken = default)
    {
        await _context.Sections.AddAsync(section, cancellationToken);
    }

    public void Remove(Section section)
    {
        _context.Sections.Remove(section);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
