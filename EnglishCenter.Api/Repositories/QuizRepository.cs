using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.Quizzes;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class QuizRepository : IQuizRepository
{
    private readonly AppDbContext _context;

    public QuizRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<QuizListItemResponse>> GetPagedAsync(
        QuizQuery query,
        int? teacherUserId,
        int? studentUserId,
        CancellationToken cancellationToken = default)
    {
        var quizzes = _context.Quizzes
            .AsNoTracking()
            .AsQueryable();

        // 1. Role Scoping
        if (teacherUserId.HasValue)
        {
            quizzes = quizzes.Where(q => q.Class.Teacher != null && q.Class.Teacher.UserId == teacherUserId.Value);
        }
        else if (studentUserId.HasValue)
        {
            quizzes = quizzes.Where(q =>
                q.Status != QuizStatus.Draft &&
                q.Class.ClassStudents.Any(cs =>
                    cs.Student.UserId == studentUserId.Value &&
                    (cs.Status == ClassStudentStatus.Active || cs.Status == ClassStudentStatus.Completed)));
        }

        // 2. Query Filters
        if (query.ClassId.HasValue)
        {
            quizzes = quizzes.Where(q => q.ClassId == query.ClassId.Value);
        }

        if (query.ParsedStatus.HasValue)
        {
            quizzes = quizzes.Where(q => q.Status == query.ParsedStatus.Value);
        }

        if (query.FromDate.HasValue)
        {
            quizzes = quizzes.Where(q => q.StartAt >= query.FromDate.Value || (q.StartAt == null && q.EndAt >= query.FromDate.Value));
        }

        if (query.ToDate.HasValue)
        {
            quizzes = quizzes.Where(q => q.EndAt <= query.ToDate.Value || (q.EndAt == null && q.StartAt <= query.ToDate.Value));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            quizzes = quizzes.Where(q =>
                q.Title.Contains(search) ||
                (q.Description != null && q.Description.Contains(search)) ||
                q.Class.ClassCode.Contains(search));
        }

        var totalItems = await quizzes.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<Quiz> ordered = sortBy switch
        {
            "id" => ascending ? quizzes.OrderBy(q => q.Id) : quizzes.OrderByDescending(q => q.Id),
            "title" => ascending ? quizzes.OrderBy(q => q.Title).ThenBy(q => q.Id) : quizzes.OrderByDescending(q => q.Title).ThenByDescending(q => q.Id),
            "status" => ascending ? quizzes.OrderBy(q => q.Status).ThenBy(q => q.Id) : quizzes.OrderByDescending(q => q.Status).ThenByDescending(q => q.Id),
            "startat" => ascending ? quizzes.OrderBy(q => q.StartAt).ThenBy(q => q.Id) : quizzes.OrderByDescending(q => q.StartAt).ThenByDescending(q => q.Id),
            "endat" => ascending ? quizzes.OrderBy(q => q.EndAt).ThenBy(q => q.Id) : quizzes.OrderByDescending(q => q.EndAt).ThenByDescending(q => q.Id),
            _ => ascending ? quizzes.OrderBy(q => q.Id) : quizzes.OrderByDescending(q => q.Id)
        };

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(q => new QuizListItemResponse
            {
                Id = q.Id,
                ClassId = q.ClassId,
                ClassCode = q.Class.ClassCode,
                CourseName = q.Class.Course.CourseName,
                ClassStatus = q.Class.Status,
                StudentMembershipStatus = studentUserId.HasValue
                    ? q.Class.ClassStudents
                        .Where(cs => cs.Student.UserId == studentUserId.Value)
                        .Select(cs => (ClassStudentStatus?)cs.Status)
                        .FirstOrDefault()
                    : null,
                TeacherName = q.Class.Teacher != null && q.Class.Teacher.User != null
                    ? q.Class.Teacher.User.FullName
                    : string.Empty,
                Title = q.Title,
                DurationMinutes = q.DurationMinutes,
                MaxAttempts = q.MaxAttempts,
                StartAt = q.StartAt,
                EndAt = q.EndAt,
                Status = q.Status,
                MaxScore = q.Questions.Sum(qn => qn.Score),
                QuestionCount = q.Questions.Count,
                AttemptCount = studentUserId.HasValue
                    ? q.QuizAttempts.Count(qa => qa.Student.UserId == studentUserId.Value)
                    : q.QuizAttempts.Count,
                HasActiveAttempt = studentUserId.HasValue
                    ? q.QuizAttempts.Any(qa => qa.Student.UserId == studentUserId.Value && qa.Status == QuizAttemptStatus.InProgress)
                    : (bool?)null
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<QuizListItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<PagedResult<TeacherQuizClassLookupItemResponse>> GetTeacherClassLookupAsync(
        TeacherQuizClassLookupQuery query,
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

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            classes = classes.Where(c => c.ClassCode.Contains(search) || c.Course.CourseName.Contains(search));
        }

        var totalItems = await classes.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<CourseClass> ordered = sortBy switch
        {
            "classcode" => ascending ? classes.OrderBy(c => c.ClassCode).ThenBy(c => c.Id) : classes.OrderByDescending(c => c.ClassCode).ThenByDescending(c => c.Id),
            "coursename" => ascending ? classes.OrderBy(c => c.Course.CourseName).ThenBy(c => c.Id) : classes.OrderByDescending(c => c.Course.CourseName).ThenByDescending(c => c.Id),
            _ => ascending ? classes.OrderBy(c => c.Id) : classes.OrderByDescending(c => c.Id)
        };

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(c => new TeacherQuizClassLookupItemResponse
            {
                ClassId = c.Id,
                ClassCode = c.ClassCode,
                CourseName = c.Course.CourseName,
                Status = c.Status,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                QuizCount = c.Quizzes.Count
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TeacherQuizClassLookupItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<Quiz?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Quizzes
            .AsNoTracking()
            .Include(q => q.Class)
                .ThenInclude(c => c.Teacher)
            .Include(q => q.Class)
                .ThenInclude(c => c.Course)
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
    }

    public async Task<Quiz?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Quizzes
            .Include(q => q.Class)
                .ThenInclude(c => c.Teacher)
            .Include(q => q.Class)
                .ThenInclude(c => c.Course)
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
    }

    public async Task<QuizDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Quizzes
            .AsNoTracking()
            .Where(q => q.Id == id)
            .Select(q => new QuizDetailResponse
            {
                Id = q.Id,
                ClassId = q.ClassId,
                CourseId = q.Class.CourseId,
                ClassCode = q.Class.ClassCode,
                CourseName = q.Class.Course.CourseName,
                ClassStatus = q.Class.Status,
                TeacherName = q.Class.Teacher != null && q.Class.Teacher.User != null
                    ? q.Class.Teacher.User.FullName
                    : string.Empty,
                Title = q.Title,
                Description = q.Description,
                DurationMinutes = q.DurationMinutes,
                MaxAttempts = q.MaxAttempts,
                StartAt = q.StartAt,
                EndAt = q.EndAt,
                Status = q.Status,
                MaxScore = q.Questions.Sum(qn => qn.Score),
                QuestionCount = q.Questions.Count,
                AttemptCount = q.QuizAttempts.Count,
                Questions = q.Questions
                    .OrderBy(qn => qn.OrderIndex)
                    .ThenBy(qn => qn.Id)
                    .Select(qn => new QuestionManagementResponse
                    {
                        Id = qn.Id,
                        QuizId = qn.QuizId,
                        Content = qn.Content,
                        QuestionType = qn.QuestionType,
                        CorrectTextAnswer = qn.CorrectTextAnswer,
                        Score = qn.Score,
                        OrderIndex = qn.OrderIndex,
                        Options = qn.QuestionOptions
                            .OrderBy(qo => qo.OrderIndex)
                            .ThenBy(qo => qo.Id)
                            .Select(qo => new QuestionOptionResponse
                            {
                                Id = qo.Id,
                                QuestionId = qo.QuestionId,
                                Content = qo.Content,
                                IsCorrect = qo.IsCorrect,
                                OrderIndex = qo.OrderIndex
                            })
                            .ToList()
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<StudentQuizDetailResponse?> GetStudentDetailByIdAsync(
        int id,
        int studentUserId,
        CancellationToken cancellationToken = default)
    {
        return await _context.Quizzes
            .AsNoTracking()
            .Where(q => q.Id == id)
            .Select(q => new StudentQuizDetailResponse
            {
                Id = q.Id,
                ClassId = q.ClassId,
                ClassCode = q.Class.ClassCode,
                CourseName = q.Class.Course.CourseName,
                ClassStatus = q.Class.Status,
                StudentMembershipStatus = q.Class.ClassStudents
                    .Where(cs => cs.Student.UserId == studentUserId)
                    .Select(cs => (ClassStudentStatus?)cs.Status)
                    .FirstOrDefault(),
                Title = q.Title,
                Description = q.Description,
                DurationMinutes = q.DurationMinutes,
                MaxAttempts = q.MaxAttempts,
                StartAt = q.StartAt,
                EndAt = q.EndAt,
                Status = q.Status,
                MaxScore = q.Questions.Sum(qn => qn.Score),
                AttemptCount = q.QuizAttempts.Count(qa => qa.Student.UserId == studentUserId),
                HasActiveAttempt = q.QuizAttempts.Any(qa => qa.Student.UserId == studentUserId && qa.Status == QuizAttemptStatus.InProgress)
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<CourseClass?> GetClassAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .Include(c => c.Teacher)
            .Include(c => c.Course)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
    }

    public async Task<bool> HasDuplicateTitleAsync(int classId, string title, int? excludeId = null, CancellationToken cancellationToken = default)
    {
        var normalized = title.Trim().ToLower();
        return await _context.Quizzes
            .AnyAsync(q => q.ClassId == classId &&
                           q.Title.ToLower() == normalized &&
                           (!excludeId.HasValue || q.Id != excludeId.Value),
                      cancellationToken);
    }

    public async Task<bool> HasAttemptsAsync(int quizId, CancellationToken cancellationToken = default)
    {
        return await _context.QuizAttempts.AnyAsync(qa => qa.QuizId == quizId, cancellationToken);
    }

    public async Task<bool> HasLiveAttemptsAsync(int quizId, DateTime utcNow, CancellationToken cancellationToken = default)
    {
        var inProgressAttempts = await _context.QuizAttempts
            .Where(qa => qa.QuizId == quizId && qa.Status == QuizAttemptStatus.InProgress)
            .Select(qa => new
            {
                qa.StartedAt,
                qa.Quiz.DurationMinutes,
                qa.Quiz.EndAt
            })
            .ToListAsync(cancellationToken);

        foreach (var att in inProgressAttempts)
        {
            DateTime? durationDeadline = att.DurationMinutes.HasValue
                ? att.StartedAt.AddMinutes(att.DurationMinutes.Value)
                : null;
            DateTime? quizEndDeadline = att.EndAt;
            DateTime? effectiveDeadline = (durationDeadline.HasValue && quizEndDeadline.HasValue)
                ? (durationDeadline.Value < quizEndDeadline.Value ? durationDeadline.Value : quizEndDeadline.Value)
                : (durationDeadline ?? quizEndDeadline);

            if (!effectiveDeadline.HasValue || utcNow <= effectiveDeadline.Value)
            {
                return true;
            }
        }

        return false;
    }

    public async Task<List<QuizAttempt>> GetStaleInProgressAttemptsAsync(int quizId, DateTime utcNow, CancellationToken cancellationToken = default)
    {
        var inProgress = await _context.QuizAttempts
            .Include(qa => qa.Quiz)
            .Include(qa => qa.QuizAnswers)
            .Where(qa => qa.QuizId == quizId && qa.Status == QuizAttemptStatus.InProgress)
            .ToListAsync(cancellationToken);

        var stale = new List<QuizAttempt>();
        foreach (var att in inProgress)
        {
            DateTime? durationDeadline = att.Quiz.DurationMinutes.HasValue
                ? att.StartedAt.AddMinutes(att.Quiz.DurationMinutes.Value)
                : null;
            DateTime? quizEndDeadline = att.Quiz.EndAt;
            DateTime? effectiveDeadline = (durationDeadline.HasValue && quizEndDeadline.HasValue)
                ? (durationDeadline.Value < quizEndDeadline.Value ? durationDeadline.Value : quizEndDeadline.Value)
                : (durationDeadline ?? quizEndDeadline);

            if (effectiveDeadline.HasValue && utcNow > effectiveDeadline.Value)
            {
                stale.Add(att);
            }
        }

        return stale;
    }

    public async Task<List<QuizAttempt>> GetInProgressAttemptsByClassIdsAsync(
        IReadOnlyCollection<int> classIds,
        CancellationToken cancellationToken = default)
    {
        var normalizedClassIds = classIds.Distinct().ToList();
        if (normalizedClassIds.Count == 0)
        {
            return new List<QuizAttempt>();
        }

        return await _context.QuizAttempts
            .Include(qa => qa.Quiz)
            .Include(qa => qa.QuizAnswers)
            .Where(qa => normalizedClassIds.Contains(qa.Quiz.ClassId) && qa.Status == QuizAttemptStatus.InProgress)
            .ToListAsync(cancellationToken);
    }

    public async Task<Question?> GetQuestionByIdAsync(int questionId, CancellationToken cancellationToken = default)
    {
        return await _context.Questions
            .Include(qn => qn.QuestionOptions)
            .Include(qn => qn.Quiz)
            .FirstOrDefaultAsync(qn => qn.Id == questionId, cancellationToken);
    }

    public async Task<List<Question>> GetQuestionsByQuizIdAsync(int quizId, CancellationToken cancellationToken = default)
    {
        return await _context.Questions
            .Include(qn => qn.QuestionOptions)
            .Where(qn => qn.QuizId == quizId)
            .OrderBy(qn => qn.OrderIndex)
            .ThenBy(qn => qn.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task AddAsync(Quiz quiz, CancellationToken cancellationToken = default)
    {
        await _context.Quizzes.AddAsync(quiz, cancellationToken);
    }

    public void Remove(Quiz quiz)
    {
        _context.Quizzes.Remove(quiz);
    }

    public void RemoveQuestion(Question question)
    {
        _context.Questions.Remove(question);
    }

    public void RemoveQuestionOptions(IEnumerable<QuestionOption> options)
    {
        _context.QuestionOptions.RemoveRange(options);
    }

    public async Task AddQuestionAsync(Question question, CancellationToken cancellationToken = default)
    {
        await _context.Questions.AddAsync(question, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
