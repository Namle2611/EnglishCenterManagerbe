using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.QuizAttempts;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class QuizAttemptRepository : IQuizAttemptRepository
{
    private readonly AppDbContext _context;

    public QuizAttemptRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<QuizAttempt?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.QuizAttempts
            .AsNoTracking()
            .Include(qa => qa.Quiz)
                .ThenInclude(q => q.Class)
                    .ThenInclude(c => c.Teacher)
            .Include(qa => qa.Student)
                .ThenInclude(s => s.User)
            .FirstOrDefaultAsync(qa => qa.Id == id, cancellationToken);
    }

    public async Task<QuizAttempt?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.QuizAttempts
            .Include(qa => qa.Quiz)
                .ThenInclude(q => q.Class)
                    .ThenInclude(c => c.Teacher)
            .Include(qa => qa.Student)
                .ThenInclude(s => s.User)
            .Include(qa => qa.QuizAnswers)
            .FirstOrDefaultAsync(qa => qa.Id == id, cancellationToken);
    }

    public async Task<QuizAttempt?> GetActiveInProgressAttemptAsync(int quizId, int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.QuizAttempts
            .Include(qa => qa.Quiz)
            .Include(qa => qa.QuizAnswers)
            .FirstOrDefaultAsync(qa => qa.QuizId == quizId &&
                                       qa.StudentId == studentId &&
                                       qa.Status == QuizAttemptStatus.InProgress,
                                  cancellationToken);
    }

    public async Task<int> GetAttemptCountAsync(int quizId, int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.QuizAttempts
            .CountAsync(qa => qa.QuizId == quizId && qa.StudentId == studentId, cancellationToken);
    }

    public async Task<PagedResult<QuizAttemptListItemResponse>> GetPagedAsync(
        int quizId,
        QuizAttemptQuery query,
        CancellationToken cancellationToken = default)
    {
        var attempts = _context.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.QuizId == quizId);

        if (query.ParsedStatus.HasValue)
        {
            attempts = attempts.Where(qa => qa.Status == query.ParsedStatus.Value);
        }

        if (query.StudentId.HasValue)
        {
            attempts = attempts.Where(qa => qa.StudentId == query.StudentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            attempts = attempts.Where(qa =>
                qa.Student.User.FullName.Contains(search) ||
                qa.Student.StudentCode.Contains(search));
        }

        var totalItems = await attempts.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<QuizAttempt> ordered = sortBy switch
        {
            "id" => ascending ? attempts.OrderBy(qa => qa.Id) : attempts.OrderByDescending(qa => qa.Id),
            "studentname" => ascending ? attempts.OrderBy(qa => qa.Student.User.FullName).ThenBy(qa => qa.Id) : attempts.OrderByDescending(qa => qa.Student.User.FullName).ThenByDescending(qa => qa.Id),
            "attemptnumber" => ascending ? attempts.OrderBy(qa => qa.AttemptNumber).ThenBy(qa => qa.Id) : attempts.OrderByDescending(qa => qa.AttemptNumber).ThenByDescending(qa => qa.Id),
            "score" => ascending ? attempts.OrderBy(qa => qa.Score).ThenBy(qa => qa.Id) : attempts.OrderByDescending(qa => qa.Score).ThenByDescending(qa => qa.Id),
            "status" => ascending ? attempts.OrderBy(qa => qa.Status).ThenBy(qa => qa.Id) : attempts.OrderByDescending(qa => qa.Status).ThenByDescending(qa => qa.Id),
            _ => ascending ? attempts.OrderBy(qa => qa.StartedAt).ThenBy(qa => qa.Id) : attempts.OrderByDescending(qa => qa.StartedAt).ThenByDescending(qa => qa.Id)
        };

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(qa => new QuizAttemptListItemResponse
            {
                AttemptId = qa.Id,
                QuizId = qa.QuizId,
                StudentId = qa.StudentId,
                StudentCode = qa.Student.StudentCode,
                StudentName = qa.Student.User.FullName,
                AttemptNumber = qa.AttemptNumber,
                Status = qa.Status,
                StartedAt = qa.StartedAt,
                SubmittedAt = qa.SubmittedAt,
                Score = qa.Score,
                QuizMaxScore = qa.Quiz.Questions.Sum(qn => qn.Score)
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<QuizAttemptListItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<List<StudentAttemptSummaryResponse>> GetStudentAttemptsAsync(
        int quizId,
        int studentId,
        bool reviewUnlocked,
        CancellationToken cancellationToken = default)
    {
        return await _context.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.QuizId == quizId && qa.StudentId == studentId)
            .OrderBy(qa => qa.AttemptNumber)
            .Select(qa => new StudentAttemptSummaryResponse
            {
                AttemptId = qa.Id,
                AttemptNumber = qa.AttemptNumber,
                Status = qa.Status,
                StartedAt = qa.StartedAt,
                SubmittedAt = qa.SubmittedAt,
                Score = reviewUnlocked ? qa.Score : null
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<StudentAttemptDetailResponse?> GetStudentAttemptDetailAsync(int attemptId, CancellationToken cancellationToken = default)
    {
        var attempt = await _context.QuizAttempts
            .AsNoTracking()
            .Include(qa => qa.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(qn => qn.QuestionOptions)
            .Include(qa => qa.QuizAnswers)
            .FirstOrDefaultAsync(qa => qa.Id == attemptId, cancellationToken);

        if (attempt == null)
        {
            return null;
        }

        DateTime? durationDeadline = attempt.Quiz.DurationMinutes.HasValue
            ? attempt.StartedAt.AddMinutes(attempt.Quiz.DurationMinutes.Value)
            : null;
        DateTime? quizEndDeadline = attempt.Quiz.EndAt;
        DateTime? effectiveDeadline = (durationDeadline.HasValue && quizEndDeadline.HasValue)
            ? (durationDeadline.Value < quizEndDeadline.Value ? durationDeadline.Value : quizEndDeadline.Value)
            : (durationDeadline ?? quizEndDeadline);

        var answerMap = attempt.QuizAnswers.ToDictionary(a => a.QuestionId);

        return new StudentAttemptDetailResponse
        {
            AttemptId = attempt.Id,
            QuizId = attempt.QuizId,
            QuizTitle = attempt.Quiz.Title,
            AttemptNumber = attempt.AttemptNumber,
            StartedAt = attempt.StartedAt,
            DurationMinutes = attempt.Quiz.DurationMinutes,
            EffectiveDeadline = effectiveDeadline,
            Status = attempt.Status,
            QuizMaxScore = attempt.Quiz.Questions.Sum(qn => qn.Score),
            Questions = attempt.Quiz.Questions
                .OrderBy(qn => qn.OrderIndex)
                .ThenBy(qn => qn.Id)
                .Select(qn => new StudentQuestionResponse
                {
                    Id = qn.Id,
                    Content = qn.Content,
                    QuestionType = qn.QuestionType,
                    Score = qn.Score,
                    OrderIndex = qn.OrderIndex,
                    Options = qn.QuestionOptions
                        .OrderBy(qo => qo.OrderIndex)
                        .ThenBy(qo => qo.Id)
                        .Select(qo => new StudentOptionResponse
                        {
                            Id = qo.Id,
                            Content = qo.Content,
                            OrderIndex = qo.OrderIndex
                        })
                        .ToList(),
                    SelectedOptionId = answerMap.TryGetValue(qn.Id, out var ans) ? ans.SelectedOptionId : null,
                    TextAnswer = answerMap.TryGetValue(qn.Id, out var ansText) ? ansText.TextAnswer : null
                })
                .ToList()
        };
    }

    public async Task<StudentOpenQuizResultResponse?> GetStudentOpenResultAsync(int attemptId, CancellationToken cancellationToken = default)
    {
        return await _context.QuizAttempts
            .AsNoTracking()
            .Where(qa => qa.Id == attemptId)
            .Select(qa => new StudentOpenQuizResultResponse
            {
                AttemptId = qa.Id,
                QuizId = qa.QuizId,
                QuizTitle = qa.Quiz.Title,
                AttemptNumber = qa.AttemptNumber,
                Status = qa.Status,
                StartedAt = qa.StartedAt,
                SubmittedAt = qa.SubmittedAt,
                TotalScore = null, // Strictly null while open
                QuizMaxScore = qa.Quiz.Questions.Sum(qn => qn.Score),
                QuestionCount = qa.Quiz.Questions.Count,
                SubmittedAnswers = qa.QuizAnswers
                    .OrderBy(a => a.QuestionId)
                    .Select(a => new StudentSubmittedAnswerSummary
                    {
                        QuestionId = a.QuestionId,
                        SelectedOptionId = a.SelectedOptionId,
                        TextAnswer = a.TextAnswer
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<StudentAttemptReviewResponse?> GetStudentAttemptReviewAsync(int attemptId, CancellationToken cancellationToken = default)
    {
        var attempt = await _context.QuizAttempts
            .AsNoTracking()
            .Include(qa => qa.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(qn => qn.QuestionOptions)
            .Include(qa => qa.QuizAnswers)
            .FirstOrDefaultAsync(qa => qa.Id == attemptId, cancellationToken);

        if (attempt == null)
        {
            return null;
        }

        var answerMap = attempt.QuizAnswers.ToDictionary(a => a.QuestionId);

        return new StudentAttemptReviewResponse
        {
            AttemptId = attempt.Id,
            QuizId = attempt.QuizId,
            QuizTitle = attempt.Quiz.Title,
            AttemptNumber = attempt.AttemptNumber,
            Status = attempt.Status,
            StartedAt = attempt.StartedAt,
            SubmittedAt = attempt.SubmittedAt,
            TotalScore = attempt.Score ?? 0m,
            QuizMaxScore = attempt.Quiz.Questions.Sum(qn => qn.Score),
            Questions = attempt.Quiz.Questions
                .OrderBy(qn => qn.OrderIndex)
                .ThenBy(qn => qn.Id)
                .Select(qn =>
                {
                    answerMap.TryGetValue(qn.Id, out var ans);
                    return new StudentQuestionReviewItem
                    {
                        QuestionId = qn.Id,
                        Content = qn.Content,
                        QuestionType = qn.QuestionType,
                        Score = qn.Score,
                        OrderIndex = qn.OrderIndex,
                        SelectedOptionId = ans?.SelectedOptionId,
                        TextAnswer = ans?.TextAnswer,
                        IsCorrect = ans?.IsCorrect,
                        ScoreEarned = ans?.ScoreEarned ?? 0m,
                        CorrectTextAnswer = qn.CorrectTextAnswer,
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
                    };
                })
                .ToList()
        };
    }

    public async Task<ManagementAttemptDetailResponse?> GetManagementAttemptDetailAsync(int attemptId, CancellationToken cancellationToken = default)
    {
        var attempt = await _context.QuizAttempts
            .AsNoTracking()
            .Include(qa => qa.Quiz)
                .ThenInclude(q => q.Class)
            .Include(qa => qa.Quiz)
                .ThenInclude(q => q.Questions)
                    .ThenInclude(qn => qn.QuestionOptions)
            .Include(qa => qa.Student)
                .ThenInclude(s => s.User)
            .Include(qa => qa.QuizAnswers)
            .FirstOrDefaultAsync(qa => qa.Id == attemptId, cancellationToken);

        if (attempt == null)
        {
            return null;
        }

        var answerMap = attempt.QuizAnswers.ToDictionary(a => a.QuestionId);

        return new ManagementAttemptDetailResponse
        {
            AttemptId = attempt.Id,
            StudentId = attempt.StudentId,
            StudentCode = attempt.Student.StudentCode,
            StudentName = attempt.Student.User.FullName,
            QuizId = attempt.QuizId,
            QuizTitle = attempt.Quiz.Title,
            ClassId = attempt.Quiz.ClassId,
            ClassCode = attempt.Quiz.Class.ClassCode,
            AttemptNumber = attempt.AttemptNumber,
            Status = attempt.Status,
            StartedAt = attempt.StartedAt,
            SubmittedAt = attempt.SubmittedAt,
            Score = attempt.Score,
            QuizMaxScore = attempt.Quiz.Questions.Sum(qn => qn.Score),
            Questions = attempt.Quiz.Questions
                .OrderBy(qn => qn.OrderIndex)
                .ThenBy(qn => qn.Id)
                .Select(qn =>
                {
                    answerMap.TryGetValue(qn.Id, out var ans);
                    return new ManagementQuestionReviewItem
                    {
                        QuestionId = qn.Id,
                        Content = qn.Content,
                        QuestionType = qn.QuestionType,
                        Score = qn.Score,
                        OrderIndex = qn.OrderIndex,
                        SelectedOptionId = ans?.SelectedOptionId,
                        TextAnswer = ans?.TextAnswer,
                        IsCorrect = ans?.IsCorrect,
                        ScoreEarned = ans?.ScoreEarned ?? 0m,
                        CorrectTextAnswer = qn.CorrectTextAnswer,
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
                    };
                })
                .ToList()
        };
    }

    public async Task<QuizAnswer?> GetAnswerAsync(int attemptId, int questionId, CancellationToken cancellationToken = default)
    {
        return await _context.QuizAnswers
            .FirstOrDefaultAsync(qa => qa.QuizAttemptId == attemptId && qa.QuestionId == questionId, cancellationToken);
    }

    public async Task<Student?> GetStudentByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);
    }

    public async Task<ClassStudent?> GetClassStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .FirstOrDefaultAsync(cs => cs.ClassId == classId && cs.StudentId == studentId, cancellationToken);
    }

    public async Task AddAttemptAsync(QuizAttempt attempt, CancellationToken cancellationToken = default)
    {
        await _context.QuizAttempts.AddAsync(attempt, cancellationToken);
    }

    public async Task AddAnswerAsync(QuizAnswer answer, CancellationToken cancellationToken = default)
    {
        await _context.QuizAnswers.AddAsync(answer, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }
}
