using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Assignments;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class AssignmentRepository : IAssignmentRepository
{
    private readonly AppDbContext _context;

    public AssignmentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AssignmentListItemResponse>> GetPagedAsync(
        AssignmentQuery query,
        int? teacherUserScope,
        int? studentUserScope,
        CancellationToken cancellationToken = default)
    {
        var assignments = _context.Assignments
            .AsNoTracking()
            .AsQueryable();

        // 1. Role scoping
        if (teacherUserScope.HasValue)
        {
            assignments = assignments.Where(a => a.Class.Teacher != null && a.Class.Teacher.UserId == teacherUserScope.Value);
        }
        else if (studentUserScope.HasValue)
        {
            assignments = assignments.Where(a =>
                a.Class.ClassStudents.Any(cs =>
                    cs.Student.UserId == studentUserScope.Value &&
                    (cs.Status == ClassStudentStatus.Active || cs.Status == ClassStudentStatus.Completed)) &&
                a.Status != AssignmentStatus.Draft);
        }

        // 2. Query filters
        if (query.ClassId.HasValue)
        {
            assignments = assignments.Where(a => a.ClassId == query.ClassId.Value);
        }

        if (query.TeacherId.HasValue)
        {
            // Historical snapshot author filter
            assignments = assignments.Where(a => a.TeacherId == query.TeacherId.Value);
        }

        if (query.ParsedStatus.HasValue)
        {
            assignments = assignments.Where(a => a.Status == query.ParsedStatus.Value);
        }

        if (query.DueFrom.HasValue)
        {
            assignments = assignments.Where(a => a.Deadline >= query.DueFrom.Value);
        }

        if (query.DueTo.HasValue)
        {
            assignments = assignments.Where(a => a.Deadline <= query.DueTo.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            assignments = assignments.Where(a =>
                a.Title.Contains(search) ||
                (a.Description != null && a.Description.Contains(search)) ||
                a.Class.ClassCode.Contains(search));
        }

        var totalItems = await assignments.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<Assignment> ordered = sortBy switch
        {
            "id" => ascending ? assignments.OrderBy(a => a.Id) : assignments.OrderByDescending(a => a.Id),
            "title" => ascending ? assignments.OrderBy(a => a.Title).ThenBy(a => a.Id) : assignments.OrderByDescending(a => a.Title).ThenByDescending(a => a.Id),
            "maxscore" => ascending ? assignments.OrderBy(a => a.MaxScore).ThenBy(a => a.Id) : assignments.OrderByDescending(a => a.MaxScore).ThenByDescending(a => a.Id),
            "status" => ascending ? assignments.OrderBy(a => a.Status).ThenBy(a => a.Id) : assignments.OrderByDescending(a => a.Status).ThenByDescending(a => a.Id),
            _ => ascending ? assignments.OrderBy(a => a.Deadline).ThenBy(a => a.Id) : assignments.OrderByDescending(a => a.Deadline).ThenByDescending(a => a.Id)
        };

        var studentIdForCheck = studentUserScope;
        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(a => new AssignmentListItemResponse
            {
                Id = a.Id,
                ClassId = a.ClassId,
                ClassCode = a.Class.ClassCode,
                CourseName = a.Class.Course.CourseName,
                TeacherId = a.TeacherId,
                TeacherName = a.Teacher != null && a.Teacher.User != null ? a.Teacher.User.FullName : string.Empty,
                Title = a.Title,
                Deadline = a.Deadline,
                MaxScore = a.MaxScore,
                Status = a.Status,
                SubmissionCount = a.Submissions.Count,
                HasSubmitted = studentIdForCheck.HasValue
                    ? a.Submissions.Any(s => s.Student.UserId == studentIdForCheck.Value)
                    : null,
                StudentMembershipStatus = studentIdForCheck.HasValue
                    ? a.Class.ClassStudents
                        .Where(cs => cs.Student.UserId == studentIdForCheck.Value)
                        .Select(cs => (ClassStudentStatus?)cs.Status)
                        .FirstOrDefault()
                    : null
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<AssignmentListItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<AssignmentDetailResponse?> GetDetailByIdAsync(
        int id,
        int? studentUserScope = null,
        CancellationToken cancellationToken = default)
    {
        return await _context.Assignments
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new AssignmentDetailResponse
            {
                Id = a.Id,
                ClassId = a.ClassId,
                ClassCode = a.Class.ClassCode,
                CourseName = a.Class.Course.CourseName,
                TeacherId = a.TeacherId,
                TeacherName = a.Teacher != null && a.Teacher.User != null ? a.Teacher.User.FullName : string.Empty,
                Title = a.Title,
                Description = a.Description,
                AttachmentUrl = a.AttachmentUrl,
                Deadline = a.Deadline,
                MaxScore = a.MaxScore,
                Status = a.Status,
                ClassStatus = a.Class.Status,
                SubmissionCount = a.Submissions.Count,
                HasSubmitted = studentUserScope.HasValue
                    ? a.Submissions.Any(s => s.Student.UserId == studentUserScope.Value)
                    : null,
                StudentMembershipStatus = studentUserScope.HasValue
                    ? a.Class.ClassStudents
                        .Where(cs => cs.Student.UserId == studentUserScope.Value)
                        .Select(cs => (ClassStudentStatus?)cs.Status)
                        .FirstOrDefault()
                    : null
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Assignment?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Assignments
            .Include(a => a.Class)
                .ThenInclude(c => c.Teacher!)
                    .ThenInclude(t => t.User)
            .Include(a => a.Class)
                .ThenInclude(c => c.Course)
            .Include(a => a.Teacher)
                .ThenInclude(t => t.User)
            .Include(a => a.Submissions)
            .FirstOrDefaultAsync(a => a.Id == id, cancellationToken);
    }

    public async Task<CourseClass?> GetClassAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .Include(c => c.Teacher!)
                .ThenInclude(t => t.User)
            .Include(c => c.Course)
            .Include(c => c.ClassStudents)
                .ThenInclude(cs => cs.Student)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
    }

    public async Task<PagedResult<TeacherAssignmentClassLookupItemResponse>> GetTeacherAssignmentClassLookupAsync(
        TeacherAssignmentClassLookupQuery query,
        int? teacherUserId,
        CancellationToken cancellationToken = default)
    {
        var classes = _context.Classes
            .AsNoTracking()
            .AsQueryable();

        if (teacherUserId.HasValue)
        {
            classes = classes.Where(c => c.Teacher != null && c.Teacher.UserId == teacherUserId.Value);
        }

        if (query.ClassId.HasValue)
        {
            classes = classes.Where(c => c.Id == query.ClassId.Value);
        }

        if (query.ParsedStatus.HasValue)
        {
            classes = classes.Where(c => c.Status == query.ParsedStatus.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            classes = classes.Where(c =>
                c.ClassCode.Contains(search) ||
                c.Course.CourseCode.Contains(search) ||
                c.Course.CourseName.Contains(search));
        }

        var totalItems = await classes.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<CourseClass> ordered = sortBy switch
        {
            "classcode" => ascending ? classes.OrderBy(c => c.ClassCode).ThenBy(c => c.Id) : classes.OrderByDescending(c => c.ClassCode).ThenByDescending(c => c.Id),
            "enddate" => ascending ? classes.OrderBy(c => c.EndDate).ThenBy(c => c.Id) : classes.OrderByDescending(c => c.EndDate).ThenByDescending(c => c.Id),
            "status" => ascending ? classes.OrderBy(c => c.Status).ThenBy(c => c.Id) : classes.OrderByDescending(c => c.Status).ThenByDescending(c => c.Id),
            _ => ascending ? classes.OrderBy(c => c.StartDate).ThenBy(c => c.Id) : classes.OrderByDescending(c => c.StartDate).ThenByDescending(c => c.Id)
        };

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(c => new TeacherAssignmentClassLookupItemResponse
            {
                ClassId = c.Id,
                ClassCode = c.ClassCode,
                CourseName = c.Course.CourseName,
                Status = c.Status,
                StartDate = c.StartDate,
                EndDate = c.EndDate
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TeacherAssignmentClassLookupItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<bool> HasSubmissionsAsync(int assignmentId, CancellationToken cancellationToken = default)
    {
        return await _context.Submissions
            .AnyAsync(s => s.AssignmentId == assignmentId, cancellationToken);
    }

    public async Task<bool> HasDuplicateTitleAsync(
        int classId,
        string normalizedTitle,
        int? excludeId = null,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Assignments
            .Where(a => a.ClassId == classId && a.Title.ToLower() == normalizedTitle);

        if (excludeId.HasValue)
        {
            query = query.Where(a => a.Id != excludeId.Value);
        }

        return await query.AnyAsync(cancellationToken);
    }

    public async Task AddAsync(Assignment assignment, CancellationToken cancellationToken = default)
    {
        await _context.Assignments.AddAsync(assignment, cancellationToken);
    }

    public void Remove(Assignment assignment)
    {
        _context.Assignments.Remove(assignment);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
