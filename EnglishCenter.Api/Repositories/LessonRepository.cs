using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Lessons;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class LessonRepository : ILessonRepository
{
    private readonly AppDbContext _context;

    public LessonRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<LessonListItemResponse>> GetPagedAsync(
        LessonQuery query,
        List<int>? allowedCourseIds,
        CancellationToken cancellationToken = default)
    {
        var queryable = _context.Lessons.AsNoTracking().AsQueryable();

        if (allowedCourseIds != null)
        {
            queryable = queryable.Where(l => allowedCourseIds.Contains(l.Section.CourseId));
        }

        if (query.SectionId.HasValue)
        {
            queryable = queryable.Where(l => l.SectionId == query.SectionId.Value);
        }

        if (query.CourseId.HasValue)
        {
            queryable = queryable.Where(l => l.Section.CourseId == query.CourseId.Value);
        }

        if (query.Status.HasValue)
        {
            queryable = queryable.Where(l => l.Status == query.Status.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            queryable = queryable.Where(l => l.Title.ToLower().Contains(search) ||
                                            (l.Content != null && l.Content.ToLower().Contains(search)));
        }

        var totalItems = await queryable.CountAsync(cancellationToken);

        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        queryable = sortBy switch
        {
            "title" => query.IsAscending
                ? queryable.OrderBy(l => l.Title).ThenBy(l => l.Id)
                : queryable.OrderByDescending(l => l.Title).ThenByDescending(l => l.Id),
            "id" => query.IsAscending
                ? queryable.OrderBy(l => l.Id)
                : queryable.OrderByDescending(l => l.Id),
            "status" => query.IsAscending
                ? queryable.OrderBy(l => l.Status).ThenBy(l => l.Id)
                : queryable.OrderByDescending(l => l.Status).ThenByDescending(l => l.Id),
            _ => query.IsAscending
                ? queryable.OrderBy(l => l.OrderIndex).ThenBy(l => l.Id)
                : queryable.OrderByDescending(l => l.OrderIndex).ThenByDescending(l => l.Id)
        };

        var page = query.Page;
        var pageSize = query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(l => new LessonListItemResponse
            {
                Id = l.Id,
                SectionId = l.SectionId,
                SectionTitle = l.Section.Title,
                CourseId = l.Section.CourseId,
                CourseCode = l.Section.Course.CourseCode,
                CourseName = l.Section.Course.CourseName,
                Title = l.Title,
                HasContent = !string.IsNullOrEmpty(l.Content),
                HasVideo = !string.IsNullOrEmpty(l.VideoUrl),
                HasAudio = !string.IsNullOrEmpty(l.AudioUrl),
                HasDocument = !string.IsNullOrEmpty(l.DocumentUrl),
                OrderIndex = l.OrderIndex,
                Status = l.Status
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<LessonListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<Lesson?> GetByIdAsync(
        int id,
        bool asNoTracking = true,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Lessons.AsQueryable();
        if (asNoTracking)
        {
            query = query.AsNoTracking();
        }

        return await query
            .Include(l => l.Section)
                .ThenInclude(s => s.Course)
            .FirstOrDefaultAsync(l => l.Id == id, cancellationToken);
    }

    public async Task<LessonDetailResponse?> GetDetailByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Lessons
            .AsNoTracking()
            .Where(l => l.Id == id)
            .Select(l => new LessonDetailResponse
            {
                Id = l.Id,
                SectionId = l.SectionId,
                SectionTitle = l.Section.Title,
                CourseId = l.Section.CourseId,
                CourseCode = l.Section.Course.CourseCode,
                CourseName = l.Section.Course.CourseName,
                Title = l.Title,
                Content = l.Content,
                VideoUrl = l.VideoUrl,
                AudioUrl = l.AudioUrl,
                DocumentUrl = l.DocumentUrl,
                OrderIndex = l.OrderIndex,
                Status = l.Status
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<bool> SectionExistsAsync(
        int sectionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Sections.AnyAsync(s => s.Id == sectionId, cancellationToken);
    }

    public async Task<Section?> GetSectionWithCourseAsync(
        int sectionId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Sections
            .AsNoTracking()
            .Include(s => s.Course)
            .FirstOrDefaultAsync(s => s.Id == sectionId, cancellationToken);
    }

    public async Task<bool> TitleExistsAsync(
        int sectionId,
        string normalizedTitle,
        int? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Lessons.Where(l => l.SectionId == sectionId);
        if (excludeId.HasValue)
        {
            query = query.Where(l => l.Id != excludeId.Value);
        }

        return await query.AnyAsync(l => l.Title.ToLower() == normalizedTitle, cancellationToken);
    }

    public async Task<int> GetMaxOrderIndexAsync(
        int sectionId,
        CancellationToken cancellationToken = default)
    {
        var max = await _context.Lessons
            .Where(l => l.SectionId == sectionId)
            .Select(l => (int?)l.OrderIndex)
            .MaxAsync(cancellationToken);

        return max ?? -1;
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

    public async Task AddAsync(Lesson lesson, CancellationToken cancellationToken = default)
    {
        await _context.Lessons.AddAsync(lesson, cancellationToken);
    }

    public void Remove(Lesson lesson)
    {
        _context.Lessons.Remove(lesson);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
