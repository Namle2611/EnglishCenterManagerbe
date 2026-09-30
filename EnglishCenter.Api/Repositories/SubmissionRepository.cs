using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Submissions;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class SubmissionRepository : ISubmissionRepository
{
    private readonly AppDbContext _context;

    public SubmissionRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<SubmissionListItemResponse>> GetPagedAsync(
        int assignmentId,
        SubmissionQuery query,
        CancellationToken cancellationToken = default)
    {
        var submissions = _context.Submissions
            .AsNoTracking()
            .Where(s => s.AssignmentId == assignmentId);

        if (query.StudentId.HasValue)
        {
            submissions = submissions.Where(s => s.StudentId == query.StudentId.Value);
        }

        if (query.IsGraded.HasValue)
        {
            submissions = query.IsGraded.Value
                ? submissions.Where(s => s.Score != null)
                : submissions.Where(s => s.Score == null);
        }

        if (query.IsLate.HasValue)
        {
            submissions = query.IsLate.Value
                ? submissions.Where(s => s.SubmittedAt > s.Assignment.Deadline)
                : submissions.Where(s => s.SubmittedAt <= s.Assignment.Deadline);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            submissions = submissions.Where(s =>
                s.Student.StudentCode.Contains(search) ||
                s.Student.User.FullName.Contains(search));
        }

        var totalItems = await submissions.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<Submission> ordered = sortBy switch
        {
            "id" => ascending ? submissions.OrderBy(s => s.Id) : submissions.OrderByDescending(s => s.Id),
            "score" => ascending ? submissions.OrderBy(s => s.Score).ThenBy(s => s.Id) : submissions.OrderByDescending(s => s.Score).ThenByDescending(s => s.Id),
            "studentcode" => ascending ? submissions.OrderBy(s => s.Student.StudentCode).ThenBy(s => s.Id) : submissions.OrderByDescending(s => s.Student.StudentCode).ThenByDescending(s => s.Id),
            "studentname" => ascending ? submissions.OrderBy(s => s.Student.User.FullName).ThenBy(s => s.Id) : submissions.OrderByDescending(s => s.Student.User.FullName).ThenByDescending(s => s.Id),
            _ => ascending ? submissions.OrderBy(s => s.SubmittedAt).ThenBy(s => s.Id) : submissions.OrderByDescending(s => s.SubmittedAt).ThenByDescending(s => s.Id)
        };

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(s => new SubmissionListItemResponse
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                StudentId = s.StudentId,
                StudentCode = s.Student.StudentCode,
                StudentName = s.Student.User.FullName,
                FileUrl = s.FileUrl,
                Content = s.Content,
                SubmittedAt = s.SubmittedAt,
                IsLate = s.SubmittedAt > s.Assignment.Deadline,
                Score = s.Score,
                Feedback = s.Feedback,
                IsGraded = s.Score != null
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<SubmissionListItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<SubmissionDetailResponse?> GetDetailByIdAsync(
        int id,
        CancellationToken cancellationToken = default)
    {
        return await _context.Submissions
            .AsNoTracking()
            .Where(s => s.Id == id)
            .Select(s => new SubmissionDetailResponse
            {
                Id = s.Id,
                AssignmentId = s.AssignmentId,
                AssignmentTitle = s.Assignment.Title,
                Deadline = s.Assignment.Deadline,
                MaxScore = s.Assignment.MaxScore,
                StudentId = s.StudentId,
                StudentCode = s.Student.StudentCode,
                StudentName = s.Student.User.FullName,
                FileUrl = s.FileUrl,
                Content = s.Content,
                SubmittedAt = s.SubmittedAt,
                IsLate = s.SubmittedAt > s.Assignment.Deadline,
                Score = s.Score,
                Feedback = s.Feedback,
                IsGraded = s.Score != null
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Submission?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Submissions
            .Include(s => s.Assignment)
                .ThenInclude(a => a.Class)
                    .ThenInclude(c => c.Teacher)
            .Include(s => s.Student)
                .ThenInclude(st => st.User)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<Submission?> GetByAssignmentAndStudentAsync(
        int assignmentId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Submissions
            .Include(s => s.Assignment)
            .Include(s => s.Student)
                .ThenInclude(st => st.User)
            .FirstOrDefaultAsync(s => s.AssignmentId == assignmentId && s.StudentId == studentId, cancellationToken);
    }

    public async Task<Student?> GetStudentByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task<ClassStudent?> GetClassStudentAsync(
        int classId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .Include(cs => cs.Class)
            .Include(cs => cs.Student)
            .FirstOrDefaultAsync(cs => cs.ClassId == classId && cs.StudentId == studentId, cancellationToken);
    }

    public async Task AddAsync(Submission submission, CancellationToken cancellationToken = default)
    {
        await _context.Submissions.AddAsync(submission, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
