using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Grades;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class GradeRepository : IGradeRepository
{
    private readonly AppDbContext _context;

    public GradeRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<CourseClass?> GetClassWithDetailsAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .AsNoTracking()
            .Include(c => c.Teacher)
                .ThenInclude(t => t!.User)
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
    }

    public async Task<ClassStudent?> GetClassStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .AsNoTracking()
            .Include(cs => cs.Student)
                .ThenInclude(s => s.User)
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Teacher)
                    .ThenInclude(t => t!.User)
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Course)
            .FirstOrDefaultAsync(cs => cs.ClassId == classId && cs.StudentId == studentId, cancellationToken);
    }

    public async Task<Student?> GetStudentByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Students
            .AsNoTracking()
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task<List<ClassStudent>> GetStudentEnrolledClassesAsync(int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .AsNoTracking()
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Teacher)
                    .ThenInclude(t => t!.User)
            .Include(cs => cs.Class)
                .ThenInclude(c => c.Course)
            .Where(cs => cs.StudentId == studentId)
            .OrderBy(cs => cs.ClassId)
            .ToListAsync(cancellationToken);
    }

    public async Task<(List<ClassStudent> Items, int TotalCount)> GetPagedClassRosterAsync(
        int classId,
        GradeQuery query,
        CancellationToken cancellationToken = default)
    {
        query.Normalize();

        var queryable = _context.ClassStudents
            .AsNoTracking()
            .Include(cs => cs.Student)
                .ThenInclude(s => s.User)
            .Where(cs => cs.ClassId == classId);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            queryable = queryable.Where(cs =>
                cs.Student.StudentCode.ToLower().Contains(search) ||
                cs.Student.User.FullName.ToLower().Contains(search));
        }

        if (query.MembershipStatus.HasValue)
        {
            queryable = queryable.Where(cs => cs.Status == query.MembershipStatus.Value);
        }

        var totalCount = await queryable.CountAsync(cancellationToken);

        queryable = query.SortBy switch
        {
            "studentname" => query.IsAscending
                ? queryable.OrderBy(cs => cs.Student.User.FullName).ThenBy(cs => cs.StudentId)
                : queryable.OrderByDescending(cs => cs.Student.User.FullName).ThenByDescending(cs => cs.StudentId),
            "id" => query.IsAscending
                ? queryable.OrderBy(cs => cs.StudentId)
                : queryable.OrderByDescending(cs => cs.StudentId),
            _ => query.IsAscending
                ? queryable.OrderBy(cs => cs.Student.StudentCode).ThenBy(cs => cs.StudentId)
                : queryable.OrderByDescending(cs => cs.Student.StudentCode).ThenByDescending(cs => cs.StudentId)
        };

        var items = await queryable
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<List<Assignment>> GetAssignmentsByClassIdAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Assignments
            .AsNoTracking()
            .Where(a => a.ClassId == classId && a.Status != AssignmentStatus.Draft)
            .OrderBy(a => a.Deadline)
            .ThenBy(a => a.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Assignment>> GetAssignmentsByClassIdsAsync(IReadOnlyCollection<int> classIds, CancellationToken cancellationToken = default)
    {
        if (classIds.Count == 0)
        {
            return new List<Assignment>();
        }

        return await _context.Assignments
            .AsNoTracking()
            .Where(a => classIds.Contains(a.ClassId) && a.Status != AssignmentStatus.Draft)
            .OrderBy(a => a.Deadline)
            .ThenBy(a => a.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Quiz>> GetQuizzesByClassIdAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .Where(q => q.ClassId == classId && q.Status != QuizStatus.Draft)
            .OrderBy(q => q.StartAt)
            .ThenBy(q => q.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Quiz>> GetQuizzesByClassIdsAsync(IReadOnlyCollection<int> classIds, CancellationToken cancellationToken = default)
    {
        if (classIds.Count == 0)
        {
            return new List<Quiz>();
        }

        return await _context.Quizzes
            .AsNoTracking()
            .Include(q => q.Questions)
            .Where(q => classIds.Contains(q.ClassId) && q.Status != QuizStatus.Draft)
            .OrderBy(q => q.StartAt)
            .ThenBy(q => q.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Submission>> GetSubmissionsByClassAndStudentsAsync(
        int classId,
        IReadOnlyCollection<int> studentIds,
        CancellationToken cancellationToken = default)
    {
        if (studentIds.Count == 0)
        {
            return new List<Submission>();
        }

        return await _context.Submissions
            .AsNoTracking()
            .Where(s => s.Assignment.ClassId == classId && studentIds.Contains(s.StudentId))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<Submission>> GetSubmissionsByStudentAndClassesAsync(
        int studentId,
        IReadOnlyCollection<int> classIds,
        CancellationToken cancellationToken = default)
    {
        if (classIds.Count == 0)
        {
            return new List<Submission>();
        }

        return await _context.Submissions
            .AsNoTracking()
            .Where(s => s.StudentId == studentId && classIds.Contains(s.Assignment.ClassId))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<QuizAttempt>> GetAttemptsByClassAndStudentsAsync(
        int classId,
        IReadOnlyCollection<int> studentIds,
        CancellationToken cancellationToken = default)
    {
        if (studentIds.Count == 0)
        {
            return new List<QuizAttempt>();
        }

        return await _context.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.Quiz.ClassId == classId && studentIds.Contains(qa.StudentId))
            .ToListAsync(cancellationToken);
    }

    public async Task<List<QuizAttempt>> GetAttemptsByStudentAndClassesAsync(
        int studentId,
        IReadOnlyCollection<int> classIds,
        CancellationToken cancellationToken = default)
    {
        if (classIds.Count == 0)
        {
            return new List<QuizAttempt>();
        }

        return await _context.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.StudentId == studentId && classIds.Contains(qa.Quiz.ClassId))
            .ToListAsync(cancellationToken);
    }
}
