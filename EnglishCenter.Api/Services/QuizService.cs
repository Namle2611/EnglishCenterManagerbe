using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Quizzes;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class QuizService : IQuizService
{
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly IQuizRepository _quizRepository;
    private readonly ILogger<QuizService> _logger;

    public QuizService(
        AppDbContext context,
        IQuizRepository quizRepository,
        ILogger<QuizService> logger)
    {
        _context = context;
        _quizRepository = quizRepository;
        _logger = logger;
    }

    public async Task<PagedResult<QuizListItemResponse>> GetListAsync(
        QuizQuery query,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        int? teacherUserId = null;
        int? studentUserId = null;

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            teacherUserId = actor.UserId;

            if (query.ClassId.HasValue)
            {
                var targetClass = await _quizRepository.GetClassAsync(query.ClassId.Value, cancellationToken);
                if (targetClass != null && targetClass.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot access quizzes for another teacher's class.");
                }
            }
        }
        else if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            studentUserId = actor.UserId;

            if (query.ClassId.HasValue)
            {
                var isEnrolled = await _context.ClassStudents.AnyAsync(
                    cs => cs.ClassId == query.ClassId.Value &&
                          cs.Student.UserId == actor.UserId &&
                          (cs.Status == ClassStudentStatus.Active || cs.Status == ClassStudentStatus.Completed),
                    cancellationToken);

                if (!isEnrolled)
                {
                    throw new ForbiddenException("You cannot access quizzes for this class.");
                }
            }
        }

        return await _quizRepository.GetPagedAsync(query, teacherUserId, studentUserId, cancellationToken);
    }

    public async Task<PagedResult<TeacherQuizClassLookupItemResponse>> GetTeacherClassLookupAsync(
        TeacherQuizClassLookupQuery query,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students cannot access teacher class lookups.");
        }

        int? teacherUserId = null;
        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            teacherUserId = actor.UserId;

            if (query.ClassId.HasValue)
            {
                var targetClass = await _quizRepository.GetClassAsync(query.ClassId.Value, cancellationToken);
                if (targetClass == null)
                {
                    throw new NotFoundException($"Class with ID {query.ClassId.Value} not found.");
                }

                if (targetClass.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot access another teacher's class.");
                }
            }
        }

        return await _quizRepository.GetTeacherClassLookupAsync(query, teacherUserId, cancellationToken);
    }

    public async Task<QuizDetailResponse> GetDetailAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        var quiz = await _quizRepository.GetByIdAsync(id, cancellationToken);
        if (quiz == null)
        {
            throw new NotFoundException($"Quiz with ID {id} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            if (quiz.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot access quizzes for another teacher's class.");
            }
        }
        else if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students cannot access management quiz details.");
        }

        return (await _quizRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<StudentQuizDetailResponse> GetStudentDetailAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can access student quiz metadata.");
        }

        var quiz = await _quizRepository.GetByIdAsync(id, cancellationToken);
        if (quiz == null || quiz.Status == QuizStatus.Draft)
        {
            throw new NotFoundException($"Quiz with ID {id} not found.");
        }

        var isEnrolled = await _context.ClassStudents.AnyAsync(
            cs => cs.ClassId == quiz.ClassId &&
                  cs.Student.UserId == actor.UserId &&
                  (cs.Status == ClassStudentStatus.Active || cs.Status == ClassStudentStatus.Completed),
            cancellationToken);

        if (!isEnrolled)
        {
            throw new ForbiddenException("You are not enrolled in the class for this quiz.");
        }

        return (await _quizRepository.GetStudentDetailByIdAsync(id, actor.UserId, cancellationToken))!;
    }

    public async Task<QuizDetailResponse> CreateAsync(
        CreateQuizRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to create quizzes.");
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var targetClass = await _quizRepository.GetClassAsync(request.ClassId!.Value, cancellationToken);
                if (targetClass == null)
                {
                    throw new NotFoundException($"Class with ID {request.ClassId.Value} not found.");
                }

                if (actor.IsTeacher && !actor.CanManageAll)
                {
                    await RequireActiveTeacherAsync(actor, cancellationToken);
                    if (targetClass.Teacher?.UserId != actor.UserId)
                    {
                        throw new ForbiddenException("You cannot create quizzes for another teacher's class.");
                    }
                }

                if (targetClass.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot create quizzes for a completed class.");
                }

                if (targetClass.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot create quizzes for a cancelled class.");
                }

                var normalizedTitle = request.Title.Trim();
                var hasDuplicate = await _quizRepository.HasDuplicateTitleAsync(
                    targetClass.Id,
                    normalizedTitle,
                    cancellationToken: cancellationToken);

                if (hasDuplicate)
                {
                    throw new ConflictException("A quiz with this title already exists in the class.");
                }

                var quiz = new Quiz
                {
                    ClassId = targetClass.Id,
                    Title = normalizedTitle,
                    Description = request.Description,
                    DurationMinutes = request.DurationMinutes,
                    MaxAttempts = request.MaxAttempts!.Value,
                    StartAt = request.StartAt,
                    EndAt = request.EndAt,
                    Status = QuizStatus.Draft // Always Draft
                };

                await _quizRepository.AddAsync(quiz, cancellationToken);
                await _quizRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _quizRepository.GetDetailByIdAsync(quiz.Id, cancellationToken))!;
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Quiz create contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Quiz could not be created due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Quiz could not be created due to concurrent conflicts. Please retry.");
    }

    public async Task<QuizDetailResponse> UpdateAsync(
        int id,
        UpdateQuizRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to update quizzes.");
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var quiz = await _quizRepository.GetByIdForUpdateAsync(id, cancellationToken);
                if (quiz == null)
                {
                    throw new NotFoundException($"Quiz with ID {id} not found.");
                }

                if (actor.IsTeacher && !actor.CanManageAll)
                {
                    await RequireActiveTeacherAsync(actor, cancellationToken);
                    if (quiz.Class.Teacher?.UserId != actor.UserId)
                    {
                        throw new ForbiddenException("You cannot update quizzes for another teacher's class.");
                    }
                }

                if (quiz.Class.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot update quizzes for a completed class.");
                }

                if (quiz.Class.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot update quizzes for a cancelled class.");
                }

                var hasAttempts = await _quizRepository.HasAttemptsAsync(id, cancellationToken);
                if (hasAttempts)
                {
                    // DurationMinutes, MaxAttempts, StartAt, EndAt are immutable once any attempt exists
                    if (quiz.DurationMinutes != request.DurationMinutes ||
                        quiz.MaxAttempts != request.MaxAttempts!.Value ||
                        quiz.StartAt != request.StartAt ||
                        quiz.EndAt != request.EndAt)
                    {
                        throw new ConflictException("Cannot modify timing, duration, or attempt limits once student attempts exist.");
                    }
                }

                var normalizedTitle = request.Title.Trim();
                var hasDuplicate = await _quizRepository.HasDuplicateTitleAsync(
                    quiz.ClassId,
                    normalizedTitle,
                    excludeId: quiz.Id,
                    cancellationToken: cancellationToken);

                if (hasDuplicate)
                {
                    throw new ConflictException("A quiz with this title already exists in the class.");
                }

                quiz.Title = normalizedTitle;
                quiz.Description = request.Description;

                if (!hasAttempts)
                {
                    quiz.DurationMinutes = request.DurationMinutes;
                    quiz.MaxAttempts = request.MaxAttempts!.Value;
                    quiz.StartAt = request.StartAt;
                    quiz.EndAt = request.EndAt;
                }

                await _quizRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _quizRepository.GetDetailByIdAsync(quiz.Id, cancellationToken))!;
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Quiz update contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Quiz could not be updated due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Quiz could not be updated due to concurrent conflicts. Please retry.");
    }

    public async Task DeleteAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to delete quizzes.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var quiz = await _quizRepository.GetByIdForUpdateAsync(id, cancellationToken);
            if (quiz == null)
            {
                throw new NotFoundException($"Quiz with ID {id} not found.");
            }

            if (actor.IsTeacher && !actor.CanManageAll)
            {
                await RequireActiveTeacherAsync(actor, cancellationToken);
                if (quiz.Class.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot delete quizzes for another teacher's class.");
                }
            }

            if (quiz.Class.Status == ClassStatus.Completed)
            {
                throw new ValidationException("Cannot delete quizzes for a completed class.");
            }

            if (quiz.Class.Status == ClassStatus.Cancelled)
            {
                throw new ValidationException("Cannot delete quizzes for a cancelled class.");
            }

            var hasAttempts = await _quizRepository.HasAttemptsAsync(id, cancellationToken);
            if (hasAttempts)
            {
                throw new ConflictException("Cannot delete quiz because student attempts exist.");
            }

            var questions = await _quizRepository.GetQuestionsByQuizIdAsync(id, cancellationToken);
            foreach (var qn in questions)
            {
                if (qn.QuestionOptions.Any())
                {
                    _quizRepository.RemoveQuestionOptions(qn.QuestionOptions);
                }
                _quizRepository.RemoveQuestion(qn);
            }

            _quizRepository.Remove(quiz);
            await _quizRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            _context.ChangeTracker.Clear();
            throw new ConflictException("Cannot delete quiz because student attempts exist.");
        }
    }

    public async Task<QuizDetailResponse> PublishAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to publish quizzes.");
        }

        var quiz = await _quizRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (quiz == null)
        {
            throw new NotFoundException($"Quiz with ID {id} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            if (quiz.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot publish quizzes for another teacher's class.");
            }
        }

        if (quiz.Class.Status == ClassStatus.Completed)
        {
            throw new ValidationException("Cannot publish quizzes for a completed class.");
        }

        if (quiz.Class.Status == ClassStatus.Cancelled)
        {
            throw new ValidationException("Cannot publish quizzes for a cancelled class.");
        }

        if (quiz.Status == QuizStatus.Published)
        {
            return (await _quizRepository.GetDetailByIdAsync(id, cancellationToken))!;
        }

        var questions = await _quizRepository.GetQuestionsByQuizIdAsync(id, cancellationToken);
        if (!questions.Any())
        {
            throw new ValidationException("Cannot publish quiz without any questions.");
        }

        // Structural validation
        foreach (var qn in questions)
        {
            if (qn.QuestionType == QuestionType.MultipleChoice)
            {
                if (qn.QuestionOptions.Count < 2 || qn.QuestionOptions.Count(o => o.IsCorrect) != 1)
                {
                    throw new ValidationException($"Question '{qn.Content}' must have at least 2 options and exactly 1 correct option.");
                }
            }
            else if (qn.QuestionType == QuestionType.TrueFalse)
            {
                if (qn.QuestionOptions.Count != 2 || qn.QuestionOptions.Count(o => o.IsCorrect) != 1)
                {
                    throw new ValidationException($"Question '{qn.Content}' must have exactly 2 options and exactly 1 correct option.");
                }
            }
            else if (qn.QuestionType == QuestionType.FillInBlank)
            {
                if (string.IsNullOrWhiteSpace(qn.CorrectTextAnswer))
                {
                    throw new ValidationException($"Question '{qn.Content}' must have a non-blank correct text answer.");
                }
            }
        }

        quiz.Status = QuizStatus.Published;
        await _quizRepository.SaveChangesAsync(cancellationToken);

        return (await _quizRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<QuizDetailResponse> CloseAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to close quizzes.");
        }

        var quiz = await _quizRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (quiz == null)
        {
            throw new NotFoundException($"Quiz with ID {id} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            if (quiz.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot close quizzes for another teacher's class.");
            }
        }

        if (quiz.Class.Status == ClassStatus.Completed)
        {
            throw new ValidationException("Cannot close quizzes for a completed class.");
        }

        if (quiz.Class.Status == ClassStatus.Cancelled)
        {
            throw new ValidationException("Cannot close quizzes for a cancelled class.");
        }

        if (quiz.Status == QuizStatus.Draft)
        {
            throw new ValidationException("Draft quizzes cannot be closed directly.");
        }

        if (quiz.Status == QuizStatus.Closed)
        {
            return (await _quizRepository.GetDetailByIdAsync(id, cancellationToken))!;
        }

        var utcNow = DateTime.UtcNow;

        // Lazy reconciliation of stale attempts
        var staleAttempts = await _quizRepository.GetStaleInProgressAttemptsAsync(id, utcNow, cancellationToken);
        foreach (var att in staleAttempts)
        {
            DateTime? durationDeadline = att.Quiz.DurationMinutes.HasValue
                ? att.StartedAt.AddMinutes(att.Quiz.DurationMinutes.Value)
                : null;
            DateTime? quizEndDeadline = att.Quiz.EndAt;
            DateTime? effectiveDeadline = (durationDeadline.HasValue && quizEndDeadline.HasValue)
                ? (durationDeadline.Value < quizEndDeadline.Value ? durationDeadline.Value : quizEndDeadline.Value)
                : (durationDeadline ?? quizEndDeadline);

            att.Status = QuizAttemptStatus.Expired;
            att.SubmittedAt = effectiveDeadline ?? utcNow;
            att.Score = att.QuizAnswers.Sum(a => a.ScoreEarned);
        }

        if (staleAttempts.Any())
        {
            await _quizRepository.SaveChangesAsync(cancellationToken);
        }

        // Check if ANY active InProgress attempt has effectiveDeadline == null
        if (!quiz.DurationMinutes.HasValue && !quiz.EndAt.HasValue)
        {
            var hasActiveNoDeadline = await _context.QuizAttempts.AnyAsync(
                qa => qa.QuizId == id && qa.Status == QuizAttemptStatus.InProgress,
                cancellationToken);

            if (hasActiveNoDeadline)
            {
                throw new ConflictException("Cannot close this quiz while an active attempt has no expiration deadline.");
            }
        }

        quiz.Status = QuizStatus.Closed;
        await _quizRepository.SaveChangesAsync(cancellationToken);

        return (await _quizRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<QuizDetailResponse> ReopenAsync(
        int id,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to reopen quizzes.");
        }

        var quiz = await _quizRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (quiz == null)
        {
            throw new NotFoundException($"Quiz with ID {id} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            if (quiz.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot reopen quizzes for another teacher's class.");
            }
        }

        if (quiz.Class.Status == ClassStatus.Completed)
        {
            throw new ValidationException("Cannot reopen quizzes for a completed class.");
        }

        if (quiz.Class.Status == ClassStatus.Cancelled)
        {
            throw new ValidationException("Cannot reopen quizzes for a cancelled class.");
        }

        if (quiz.Status == QuizStatus.Published)
        {
            return (await _quizRepository.GetDetailByIdAsync(id, cancellationToken))!;
        }

        var hasAttempts = await _quizRepository.HasAttemptsAsync(id, cancellationToken);
        if (hasAttempts)
        {
            if (quiz.EndAt.HasValue && quiz.EndAt.Value <= DateTime.UtcNow)
            {
                throw new ConflictException("Cannot reopen quiz because the expiration deadline has already passed and timing is frozen.");
            }
        }

        quiz.Status = QuizStatus.Published;
        await _quizRepository.SaveChangesAsync(cancellationToken);

        return (await _quizRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    private async Task<Teacher> RequireActiveTeacherAsync(QuizActor actor, CancellationToken cancellationToken)
    {
        var teacher = await _context.Teachers
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == actor.UserId, cancellationToken);

        if (teacher == null)
        {
            throw new ForbiddenException("Teacher profile not found.");
        }

        if (teacher.Status != TeacherStatus.Active)
        {
            throw new ForbiddenException("Only active teachers can manage quizzes.");
        }

        return teacher;
    }

    private static bool IsTransientConflict(Exception? exception)
    {
        while (exception != null)
        {
            if (exception is DbUpdateConcurrencyException)
            {
                return true;
            }

            if (exception is SqlException sqlEx &&
                (sqlEx.Number == 1205 || sqlEx.Number == 1222 || sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                return true;
            }

            exception = exception.InnerException;
        }

        return false;
    }
}
