using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.QuizAttempts;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class QuizAttemptService : IQuizAttemptService
{
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly IQuizAttemptRepository _attemptRepository;
    private readonly IQuizRepository _quizRepository;
    private readonly ILogger<QuizAttemptService> _logger;

    public QuizAttemptService(
        AppDbContext context,
        IQuizAttemptRepository attemptRepository,
        IQuizRepository quizRepository,
        ILogger<QuizAttemptService> logger)
    {
        _context = context;
        _attemptRepository = attemptRepository;
        _quizRepository = quizRepository;
        _logger = logger;
    }

    public async Task<PagedResult<QuizAttemptListItemResponse>> GetAttemptsForQuizAsync(
        int quizId,
        QuizAttemptQuery query,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        var quiz = await _quizRepository.GetByIdAsync(quizId, cancellationToken);
        if (quiz == null)
        {
            throw new NotFoundException($"Quiz with ID {quizId} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            if (quiz.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot view attempts for another teacher's quiz.");
            }
        }
        else if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students cannot view class quiz attempt lists.");
        }

        return await _attemptRepository.GetPagedAsync(quizId, query, cancellationToken);
    }

    public async Task<List<StudentAttemptSummaryResponse>> GetMyAttemptsAsync(
        int quizId,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can access personal quiz attempts.");
        }

        var student = await _attemptRepository.GetStudentByUserIdAsync(actor.UserId, cancellationToken);
        if (student == null)
        {
            throw new ForbiddenException("Student profile not found.");
        }

        var quiz = await _quizRepository.GetByIdAsync(quizId, cancellationToken);
        if (quiz == null || quiz.Status == QuizStatus.Draft)
        {
            throw new NotFoundException($"Quiz with ID {quizId} not found.");
        }

        var utcNow = DateTime.UtcNow;
        await ReconcileQuizStaleAttemptsAsync(quizId, utcNow, cancellationToken);

        var reviewUnlocked = await IsReviewUnlockedAsync(quiz, utcNow, cancellationToken);
        return await _attemptRepository.GetStudentAttemptsAsync(quizId, student.Id, reviewUnlocked, cancellationToken);
    }

    public async Task<(StudentAttemptDetailResponse Response, bool Created)> StartAttemptAsync(
        int quizId,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can start quiz attempts.");
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var student = await _attemptRepository.GetStudentByUserIdAsync(actor.UserId, cancellationToken);
                if (student == null)
                {
                    throw new ForbiddenException("Student profile not found.");
                }

                var quiz = await _quizRepository.GetByIdForUpdateAsync(quizId, cancellationToken);
                if (quiz == null || quiz.Status == QuizStatus.Draft)
                {
                    throw new NotFoundException($"Quiz with ID {quizId} not found.");
                }

                var utcNow = DateTime.UtcNow;

                // Reconcile existing stale InProgress attempt for this student
                var activeAttempt = await _attemptRepository.GetActiveInProgressAttemptAsync(quizId, student.Id, cancellationToken);
                if (activeAttempt != null)
                {
                    var effectiveDeadline = CalculateEffectiveDeadline(quiz, activeAttempt.StartedAt);
                    if (effectiveDeadline.HasValue && utcNow > effectiveDeadline.Value)
                    {
                        await FinalizeExpiredAttemptAsync(activeAttempt, effectiveDeadline.Value, quiz, cancellationToken);
                        activeAttempt = null; // Unblocked!
                    }
                    else
                    {
                        // Idempotent resume
                        await transaction.CommitAsync(cancellationToken);
                        var detail = await _attemptRepository.GetStudentAttemptDetailAsync(activeAttempt.Id, cancellationToken);
                        return (detail!, false);
                    }
                }

                // Check Class Status
                if (quiz.Class.Status == ClassStatus.Planned)
                {
                    throw new ValidationException("Cannot start attempts for a planned class.");
                }

                if (quiz.Class.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot start attempts for a completed class.");
                }

                if (quiz.Class.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot start attempts for a cancelled class.");
                }

                // Check Quiz Status
                if (quiz.Status == QuizStatus.Closed)
                {
                    throw new ValidationException("Cannot start attempts for a closed quiz.");
                }

                // Check Availability Window
                if (quiz.StartAt.HasValue && utcNow < quiz.StartAt.Value)
                {
                    throw new ValidationException("Quiz is not yet open for attempts.");
                }

                if (quiz.EndAt.HasValue && utcNow > quiz.EndAt.Value)
                {
                    throw new ValidationException("Quiz submission deadline has passed.");
                }

                // Check Student Enrollment
                var classStudent = await _attemptRepository.GetClassStudentAsync(quiz.ClassId, student.Id, cancellationToken);
                if (classStudent == null)
                {
                    throw new ForbiddenException("Only enrolled students can start quiz attempts.");
                }

                if (classStudent.Status != ClassStudentStatus.Active)
                {
                    throw new ValidationException($"Students with membership status '{classStudent.Status}' cannot start quiz attempts.");
                }

                // Check MaxAttempts
                var attemptCount = await _attemptRepository.GetAttemptCountAsync(quizId, student.Id, cancellationToken);
                if (attemptCount >= quiz.MaxAttempts)
                {
                    throw new ValidationException("Maximum number of attempts reached for this quiz.");
                }

                var newAttempt = new QuizAttempt
                {
                    QuizId = quizId,
                    StudentId = student.Id,
                    AttemptNumber = attemptCount + 1,
                    StartedAt = utcNow,
                    Status = QuizAttemptStatus.InProgress,
                    SubmittedAt = null,
                    Score = null
                };

                await _attemptRepository.AddAttemptAsync(newAttempt, cancellationToken);
                await _attemptRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                var response = await _attemptRepository.GetStudentAttemptDetailAsync(newAttempt.Id, cancellationToken);
                return (response!, true);
            }
            catch (Exception ex) when (IsForeignKeyViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new NotFoundException($"Quiz with ID {quizId} not found.");
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Start attempt unique conflict on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(Random.Shared.Next(50, 150) * (attempt + 1), cancellationToken);
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                // Concurrent start race: resume the existing attempt
                var student = await _attemptRepository.GetStudentByUserIdAsync(actor.UserId, cancellationToken);
                if (student != null)
                {
                    var existing = await _attemptRepository.GetActiveInProgressAttemptAsync(quizId, student.Id, cancellationToken);
                    if (existing != null)
                    {
                        var detail = await _attemptRepository.GetStudentAttemptDetailAsync(existing.Id, cancellationToken);
                        return (detail!, false);
                    }
                }
                throw new ConflictException("Concurrent attempt contention. Please retry.");
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Start attempt contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(Random.Shared.Next(50, 150) * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Could not start attempt due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Could not start attempt due to concurrent conflicts. Please retry.");
    }

    public async Task<object> GetAttemptDetailAsync(
        int attemptId,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        var attempt = await _attemptRepository.GetByIdForUpdateAsync(attemptId, cancellationToken);
        if (attempt == null)
        {
            throw new NotFoundException($"Quiz attempt with ID {attemptId} not found.");
        }

        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            if (attempt.Student.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot access another student's quiz attempt.");
            }

            var utcNow = DateTime.UtcNow;

            // Reconcile if InProgress
            if (attempt.Status == QuizAttemptStatus.InProgress)
            {
                var classStudent = await _attemptRepository.GetClassStudentAsync(attempt.Quiz.ClassId, attempt.StudentId, cancellationToken);
                if (classStudent != null && classStudent.Status == ClassStudentStatus.Withdrawn)
                {
                    var deadline = CalculateEffectiveDeadline(attempt.Quiz, attempt.StartedAt);
                    await FinalizeExpiredAttemptAsync(attempt, deadline ?? utcNow, attempt.Quiz, cancellationToken);
                    await _attemptRepository.SaveChangesAsync(cancellationToken);
                }
                else
                {
                    var effectiveDeadline = CalculateEffectiveDeadline(attempt.Quiz, attempt.StartedAt);
                    if (effectiveDeadline.HasValue && utcNow > effectiveDeadline.Value)
                    {
                        await FinalizeExpiredAttemptAsync(attempt, effectiveDeadline.Value, attempt.Quiz, cancellationToken);
                        await _attemptRepository.SaveChangesAsync(cancellationToken);
                    }
                }
            }

            if (attempt.Status == QuizAttemptStatus.InProgress)
            {
                return (await _attemptRepository.GetStudentAttemptDetailAsync(attemptId, cancellationToken))!;
            }

            // Attempt is Submitted or Expired: check review unlock
            var reviewUnlocked = await IsReviewUnlockedAsync(attempt.Quiz, utcNow, cancellationToken);
            if (reviewUnlocked)
            {
                return (await _attemptRepository.GetStudentAttemptReviewAsync(attemptId, cancellationToken))!;
            }

            return (await _attemptRepository.GetStudentOpenResultAsync(attemptId, cancellationToken))!;
        }

        // Management access
        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            if (attempt.Quiz.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot view attempts for another teacher's class.");
            }
        }

        return (await _attemptRepository.GetManagementAttemptDetailAsync(attemptId, cancellationToken))!;
    }

    public async Task<StudentAnswerResponse> SaveAnswerAsync(
        int attemptId,
        int questionId,
        SaveAnswerRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can save quiz answers.");
        }

        for (var retry = 0; retry <= MaxConcurrencyRetries; retry++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var attempt = await _attemptRepository.GetByIdForUpdateAsync(attemptId, cancellationToken);
                if (attempt == null)
                {
                    throw new NotFoundException($"Quiz attempt with ID {attemptId} not found.");
                }

                if (attempt.Student.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot save answers to another student's attempt.");
                }

                var utcNow = DateTime.UtcNow;

                // Check student membership status
                var classStudent = await _attemptRepository.GetClassStudentAsync(attempt.Quiz.ClassId, attempt.StudentId, cancellationToken);
                if (classStudent != null && classStudent.Status == ClassStudentStatus.Withdrawn)
                {
                    var deadline = CalculateEffectiveDeadline(attempt.Quiz, attempt.StartedAt);
                    await FinalizeExpiredAttemptAsync(attempt, deadline ?? utcNow, attempt.Quiz, cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                    throw new ForbiddenException("Withdrawn students cannot modify quiz answers.");
                }

                // Check lazy expiration
                if (attempt.Status == QuizAttemptStatus.InProgress)
                {
                    var effectiveDeadline = CalculateEffectiveDeadline(attempt.Quiz, attempt.StartedAt);
                    if (effectiveDeadline.HasValue && utcNow > effectiveDeadline.Value)
                    {
                        await FinalizeExpiredAttemptAsync(attempt, effectiveDeadline.Value, attempt.Quiz, cancellationToken);
                        await transaction.CommitAsync(cancellationToken);
                        throw new ValidationException("Attempt has expired.");
                    }
                }

                if (attempt.Status != QuizAttemptStatus.InProgress)
                {
                    throw new ValidationException("Cannot save answers for an attempt that is not in progress.");
                }

                // Validate question
                var question = await _quizRepository.GetQuestionByIdAsync(questionId, cancellationToken);
                if (question == null || question.QuizId != attempt.QuizId)
                {
                    throw new ValidationException("Question does not belong to this quiz attempt.");
                }

                // Question type referential validation
                if (question.QuestionType is QuestionType.MultipleChoice or QuestionType.TrueFalse)
                {
                    if (!request.SelectedOptionId.HasValue)
                    {
                        throw new ValidationException("SelectedOptionId is required for this question.");
                    }

                    var option = question.QuestionOptions.FirstOrDefault(o => o.Id == request.SelectedOptionId.Value);
                    if (option == null)
                    {
                        throw new ValidationException("Selected option does not belong to this question.");
                    }

                    if (!string.IsNullOrWhiteSpace(request.TextAnswer))
                    {
                        throw new ValidationException("TextAnswer must be null for option-based questions.");
                    }
                }
                else if (question.QuestionType == QuestionType.FillInBlank)
                {
                    if (request.SelectedOptionId.HasValue)
                    {
                        throw new ValidationException("SelectedOptionId must be null for fill-in-the-blank questions.");
                    }

                    if (string.IsNullOrWhiteSpace(request.TextAnswer))
                    {
                        throw new ValidationException("TextAnswer is required for fill-in-the-blank questions.");
                    }
                }

                // Upsert answer
                var answer = await _attemptRepository.GetAnswerAsync(attemptId, questionId, cancellationToken);
                if (answer == null)
                {
                    answer = new QuizAnswer
                    {
                        QuizAttemptId = attemptId,
                        QuestionId = questionId,
                        SelectedOptionId = request.SelectedOptionId,
                        TextAnswer = request.TextAnswer,
                        IsCorrect = null,
                        ScoreEarned = 0.00m
                    };
                    await _attemptRepository.AddAnswerAsync(answer, cancellationToken);
                }
                else
                {
                    answer.SelectedOptionId = request.SelectedOptionId;
                    answer.TextAnswer = request.TextAnswer;
                    answer.IsCorrect = null;
                    answer.ScoreEarned = 0.00m;
                }

                await _attemptRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return new StudentAnswerResponse
                {
                    QuestionId = questionId,
                    SelectedOptionId = answer.SelectedOptionId,
                    TextAnswer = answer.TextAnswer,
                    SavedAt = utcNow
                };
            }
            catch (Exception ex) when (IsTransientConflict(ex) && retry < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Save answer contention on attempt {Attempt}; retrying.", retry + 1);
                await Task.Delay(Random.Shared.Next(50, 150) * (retry + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Could not save answer due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Could not save answer due to concurrent conflicts. Please retry.");
    }

    public async Task<object> SubmitAttemptAsync(
        int attemptId,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can submit quiz attempts.");
        }

        for (var retry = 0; retry <= MaxConcurrencyRetries; retry++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var attempt = await _attemptRepository.GetByIdForUpdateAsync(attemptId, cancellationToken);
                if (attempt == null)
                {
                    throw new NotFoundException($"Quiz attempt with ID {attemptId} not found.");
                }

                if (attempt.Student.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot submit another student's attempt.");
                }

                var utcNow = DateTime.UtcNow;

                // Idempotent submit
                if (attempt.Status != QuizAttemptStatus.InProgress)
                {
                    await transaction.CommitAsync(cancellationToken);
                    if (attempt.Quiz.EndAt.HasValue && utcNow > attempt.Quiz.EndAt.Value)
                    {
                        return (await _attemptRepository.GetStudentAttemptReviewAsync(attemptId, cancellationToken))!;
                    }
                    return (await _attemptRepository.GetStudentOpenResultAsync(attemptId, cancellationToken))!;
                }

                // Check effective deadline and student status
                var classStudent = await _attemptRepository.GetClassStudentAsync(attempt.Quiz.ClassId, attempt.StudentId, cancellationToken);
                var effectiveDeadline = CalculateEffectiveDeadline(attempt.Quiz, attempt.StartedAt);
                if (classStudent != null && classStudent.Status == ClassStudentStatus.Withdrawn)
                {
                    attempt.Status = QuizAttemptStatus.Expired;
                    attempt.SubmittedAt = effectiveDeadline ?? utcNow;
                }
                else if (effectiveDeadline.HasValue && utcNow > effectiveDeadline.Value)
                {
                    attempt.Status = QuizAttemptStatus.Expired;
                    attempt.SubmittedAt = effectiveDeadline.Value;
                }
                else
                {
                    attempt.Status = QuizAttemptStatus.Submitted;
                    attempt.SubmittedAt = utcNow;
                }

                // Execute Auto-Grading
                var questions = await _quizRepository.GetQuestionsByQuizIdAsync(attempt.QuizId, cancellationToken);
                var answerMap = attempt.QuizAnswers.ToDictionary(a => a.QuestionId);

                foreach (var qn in questions)
                {
                    if (!answerMap.TryGetValue(qn.Id, out var ans))
                    {
                        ans = new QuizAnswer
                        {
                            QuizAttemptId = attempt.Id,
                            QuestionId = qn.Id,
                            SelectedOptionId = null,
                            TextAnswer = null,
                            IsCorrect = false,
                            ScoreEarned = 0.00m
                        };
                        await _attemptRepository.AddAnswerAsync(ans, cancellationToken);
                    }
                    else
                    {
                        if (qn.QuestionType is QuestionType.MultipleChoice or QuestionType.TrueFalse)
                        {
                            var option = qn.QuestionOptions.FirstOrDefault(o => o.Id == ans.SelectedOptionId);
                            if (option != null && option.IsCorrect)
                            {
                                ans.IsCorrect = true;
                                ans.ScoreEarned = qn.Score;
                            }
                            else
                            {
                                ans.IsCorrect = false;
                                ans.ScoreEarned = 0.00m;
                            }
                        }
                        else if (qn.QuestionType == QuestionType.FillInBlank)
                        {
                            if (!string.IsNullOrWhiteSpace(ans.TextAnswer) &&
                                !string.IsNullOrWhiteSpace(qn.CorrectTextAnswer) &&
                                string.Equals(ans.TextAnswer.Trim(), qn.CorrectTextAnswer.Trim(), StringComparison.OrdinalIgnoreCase))
                            {
                                ans.IsCorrect = true;
                                ans.ScoreEarned = qn.Score;
                            }
                            else
                            {
                                ans.IsCorrect = false;
                                ans.ScoreEarned = 0.00m;
                            }
                        }
                    }
                }

                await _attemptRepository.SaveChangesAsync(cancellationToken);
                attempt.Score = attempt.QuizAnswers.Sum(a => a.ScoreEarned);
                await _attemptRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                // To prevent answer-key leakage during ambiguous concurrent states (Section 44, 45, 66),
                // submission returns safe open result if EndAt has not expired.
                // Subsequent GET authoritatively determines full review once all live attempts are proven finished.
                if (attempt.Quiz.EndAt.HasValue && utcNow > attempt.Quiz.EndAt.Value)
                {
                    return (await _attemptRepository.GetStudentAttemptReviewAsync(attemptId, cancellationToken))!;
                }

                return (await _attemptRepository.GetStudentOpenResultAsync(attemptId, cancellationToken))!;
            }
            catch (Exception ex) when (IsTransientConflict(ex) && retry < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Submit attempt contention on attempt {Attempt}; retrying.", retry + 1);
                await Task.Delay(Random.Shared.Next(50, 150) * (retry + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Could not submit attempt due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Could not submit attempt due to concurrent conflicts. Please retry.");
    }

    private async Task<bool> IsReviewUnlockedAsync(Quiz quiz, DateTime utcNow, CancellationToken cancellationToken)
    {
        if (quiz.EndAt.HasValue && utcNow > quiz.EndAt.Value)
        {
            return true;
        }

        if (quiz.Status == QuizStatus.Closed)
        {
            await ReconcileQuizStaleAttemptsAsync(quiz.Id, utcNow, cancellationToken);
            var hasLive = await _quizRepository.HasLiveAttemptsAsync(quiz.Id, utcNow, cancellationToken);
            return !hasLive;
        }

        return false;
    }

    private async Task ReconcileQuizStaleAttemptsAsync(int quizId, DateTime utcNow, CancellationToken cancellationToken)
    {
        var stale = await _quizRepository.GetStaleInProgressAttemptsAsync(quizId, utcNow, cancellationToken);
        if (!stale.Any())
        {
            return;
        }

        foreach (var att in stale)
        {
            DateTime? durationDeadline = att.Quiz.DurationMinutes.HasValue
                ? att.StartedAt.AddMinutes(att.Quiz.DurationMinutes.Value)
                : null;
            DateTime? quizEndDeadline = att.Quiz.EndAt;
            DateTime? effectiveDeadline = (durationDeadline.HasValue && quizEndDeadline.HasValue)
                ? (durationDeadline.Value < quizEndDeadline.Value ? durationDeadline.Value : quizEndDeadline.Value)
                : (durationDeadline ?? quizEndDeadline);

            await FinalizeExpiredAttemptAsync(att, effectiveDeadline ?? utcNow, att.Quiz, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<Dictionary<int, HashSet<int>>> ReconcileClassesStaleAttemptsAsync(
        IReadOnlyCollection<int> classIds,
        DateTime utcNow,
        CancellationToken cancellationToken = default)
    {
        var normalizedClassIds = classIds.Distinct().ToList();
        var result = new Dictionary<int, HashSet<int>>();
        foreach (var classId in normalizedClassIds)
        {
            result[classId] = new HashSet<int>();
        }

        if (normalizedClassIds.Count == 0)
        {
            return result;
        }

        var inProgressAttempts = await _quizRepository.GetInProgressAttemptsByClassIdsAsync(normalizedClassIds, cancellationToken);
        var hasStaleMutations = false;
        var questionsCache = new Dictionary<int, List<Question>>();

        foreach (var att in inProgressAttempts)
        {
            var quiz = att.Quiz;
            DateTime? durationDeadline = quiz.DurationMinutes.HasValue
                ? att.StartedAt.AddMinutes(quiz.DurationMinutes.Value)
                : null;
            DateTime? quizEndDeadline = quiz.EndAt;
            DateTime? effectiveDeadline = (durationDeadline.HasValue && quizEndDeadline.HasValue)
                ? (durationDeadline.Value < quizEndDeadline.Value ? durationDeadline.Value : quizEndDeadline.Value)
                : (durationDeadline ?? quizEndDeadline);

            if (effectiveDeadline.HasValue && utcNow > effectiveDeadline.Value)
            {
                if (!questionsCache.TryGetValue(quiz.Id, out var questions))
                {
                    questions = await _quizRepository.GetQuestionsByQuizIdAsync(quiz.Id, cancellationToken);
                    questionsCache[quiz.Id] = questions;
                }

                await FinalizeExpiredAttemptAsync(att, effectiveDeadline.Value, quiz, cancellationToken, questions);
                hasStaleMutations = true;
            }
            else
            {
                if (result.TryGetValue(quiz.ClassId, out var liveSet))
                {
                    liveSet.Add(quiz.Id);
                }
            }
        }

        if (hasStaleMutations)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return result;
    }

    private async Task FinalizeExpiredAttemptAsync(
        QuizAttempt attempt,
        DateTime submittedAt,
        Quiz quiz,
        CancellationToken cancellationToken,
        List<Question>? questions = null)
    {
        attempt.Status = QuizAttemptStatus.Expired;
        attempt.SubmittedAt = submittedAt;

        questions ??= await _quizRepository.GetQuestionsByQuizIdAsync(quiz.Id, cancellationToken);
        var answerMap = attempt.QuizAnswers.ToDictionary(a => a.QuestionId);

        foreach (var qn in questions)
        {
            if (!answerMap.TryGetValue(qn.Id, out var ans))
            {
                ans = new QuizAnswer
                {
                    QuizAttemptId = attempt.Id,
                    QuestionId = qn.Id,
                    SelectedOptionId = null,
                    TextAnswer = null,
                    IsCorrect = false,
                    ScoreEarned = 0.00m
                };
                await _attemptRepository.AddAnswerAsync(ans, cancellationToken);
            }
            else
            {
                if (qn.QuestionType is QuestionType.MultipleChoice or QuestionType.TrueFalse)
                {
                    var option = qn.QuestionOptions.FirstOrDefault(o => o.Id == ans.SelectedOptionId);
                    if (option != null && option.IsCorrect)
                    {
                        ans.IsCorrect = true;
                        ans.ScoreEarned = qn.Score;
                    }
                    else
                    {
                        ans.IsCorrect = false;
                        ans.ScoreEarned = 0.00m;
                    }
                }
                else if (qn.QuestionType == QuestionType.FillInBlank)
                {
                    if (!string.IsNullOrWhiteSpace(ans.TextAnswer) &&
                        !string.IsNullOrWhiteSpace(qn.CorrectTextAnswer) &&
                        string.Equals(ans.TextAnswer.Trim(), qn.CorrectTextAnswer.Trim(), StringComparison.OrdinalIgnoreCase))
                    {
                        ans.IsCorrect = true;
                        ans.ScoreEarned = qn.Score;
                    }
                    else
                    {
                        ans.IsCorrect = false;
                        ans.ScoreEarned = 0.00m;
                    }
                }
            }
        }

        attempt.Score = attempt.QuizAnswers.Sum(a => a.ScoreEarned);
    }

    private static DateTime? CalculateEffectiveDeadline(Quiz quiz, DateTime startedAt)
    {
        DateTime? durationDeadline = quiz.DurationMinutes.HasValue
            ? startedAt.AddMinutes(quiz.DurationMinutes.Value)
            : null;
        DateTime? quizEndDeadline = quiz.EndAt;
        return (durationDeadline.HasValue && quizEndDeadline.HasValue)
            ? (durationDeadline.Value < quizEndDeadline.Value ? durationDeadline.Value : quizEndDeadline.Value)
            : (durationDeadline ?? quizEndDeadline);
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
            throw new ForbiddenException("Only active teachers can access class quiz attempts.");
        }

        return teacher;
    }

    private static bool IsUniqueConstraintViolation(Exception? exception)
    {
        while (exception != null)
        {
            if (exception is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                return true;
            }
            exception = exception.InnerException;
        }
        return false;
    }

    private static bool IsForeignKeyViolation(Exception? exception)
    {
        while (exception != null)
        {
            if (exception is SqlException sqlEx && sqlEx.Number == 547)
            {
                return true;
            }
            exception = exception.InnerException;
        }
        return false;
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
