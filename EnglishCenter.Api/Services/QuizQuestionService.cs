using System.ComponentModel.DataAnnotations;
using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using ValidationException = EnglishCenter.Api.Common.Exceptions.ValidationException;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.QuizAi;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class QuizQuestionService : IQuizQuestionService
{
    private const int MaxConcurrencyRetries = 2;
    private readonly AppDbContext _context;
    private readonly IQuizRepository _quizRepository;
    private readonly ILogger<QuizQuestionService> _logger;

    public QuizQuestionService(
        AppDbContext context,
        IQuizRepository quizRepository,
        ILogger<QuizQuestionService> logger)
    {
        _context = context;
        _quizRepository = quizRepository;
        _logger = logger;
    }

    public async Task<List<QuestionManagementResponse>> GetQuestionsAsync(
        int quizId,
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
                throw new ForbiddenException("You cannot access questions for another teacher's quiz.");
            }
        }
        else if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students are not permitted to access question management views.");
        }

        var questions = await _quizRepository.GetQuestionsByQuizIdAsync(quizId, cancellationToken);
        return questions.Select(MapToManagementResponse).ToList();
    }

    public async Task<QuestionManagementResponse> CreateAsync(
        int quizId,
        CreateQuestionRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to create questions.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var quiz = await _quizRepository.GetByIdForUpdateAsync(quizId, cancellationToken);
            if (quiz == null)
            {
                throw new NotFoundException($"Quiz with ID {quizId} not found.");
            }

            if (actor.IsTeacher && !actor.CanManageAll)
            {
                await RequireActiveTeacherAsync(actor, cancellationToken);
                if (quiz.Class.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot create questions for another teacher's quiz.");
                }
            }

            if (quiz.Class.Status == ClassStatus.Completed)
            {
                throw new ValidationException("Cannot add questions to a quiz in a completed class.");
            }

            if (quiz.Class.Status == ClassStatus.Cancelled)
            {
                throw new ValidationException("Cannot add questions to a quiz in a cancelled class.");
            }

            var hasAttempts = await _quizRepository.HasAttemptsAsync(quizId, cancellationToken);
            if (hasAttempts)
            {
                throw new ConflictException("Cannot add questions to a quiz after student attempts exist.");
            }

            var question = new Question
            {
                QuizId = quizId,
                Content = request.Content.Trim(),
                QuestionType = request.QuestionType!.Value,
                Score = request.Score!.Value,
                OrderIndex = request.OrderIndex!.Value,
                CorrectTextAnswer = request.QuestionType.Value == QuestionType.FillInBlank
                    ? request.CorrectTextAnswer?.Trim()
                    : null
            };

            if (request.QuestionType.Value != QuestionType.FillInBlank && request.Options != null)
            {
                foreach (var opt in request.Options)
                {
                    question.QuestionOptions.Add(new QuestionOption
                    {
                        Content = opt.Content.Trim(),
                        IsCorrect = opt.IsCorrect!.Value,
                        OrderIndex = opt.OrderIndex!.Value
                    });
                }
            }

            await _quizRepository.AddQuestionAsync(question, cancellationToken);
            await _quizRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return MapToManagementResponse(question);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            _context.ChangeTracker.Clear();
            throw;
        }
    }

    public async Task<List<QuestionManagementResponse>> CreateBulkAsync(
        int quizId,
        List<ApplyGeneratedQuestionItemRequest> questions,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to create questions.");
        }

        if (!actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Only teachers, staff, and administrators can manage questions.");
        }

        if (questions == null || questions.Count == 0)
        {
            throw new ValidationException("At least one question must be applied.");
        }

        // Validate all incoming questions upfront
        for (int i = 0; i < questions.Count; i++)
        {
            var q = questions[i];
            var validationContext = new ValidationContext(q);
            var validationResults = new List<ValidationResult>();
            if (!Validator.TryValidateObject(q, validationContext, validationResults, true))
            {
                var firstError = validationResults.FirstOrDefault()?.ErrorMessage ?? $"Question at index {i} is invalid.";
                throw new ValidationException(firstError);
            }

            foreach (var customResult in q.Validate(validationContext))
            {
                throw new ValidationException(customResult.ErrorMessage ?? $"Question at index {i} failed validation.");
            }

            if (q.Options != null)
            {
                for (int j = 0; j < q.Options.Count; j++)
                {
                    var opt = q.Options[j];
                    var optContext = new ValidationContext(opt);
                    var optResults = new List<ValidationResult>();
                    if (!Validator.TryValidateObject(opt, optContext, optResults, true))
                    {
                        var firstError = optResults.FirstOrDefault()?.ErrorMessage ?? $"Option {j} in question {i} is invalid.";
                        throw new ValidationException(firstError);
                    }

                    foreach (var customResult in opt.Validate(optContext))
                    {
                        throw new ValidationException(customResult.ErrorMessage ?? $"Option {j} in question {i} failed validation.");
                    }
                }
            }
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var quiz = await _quizRepository.GetByIdForUpdateAsync(quizId, cancellationToken);
                if (quiz == null)
                {
                    throw new NotFoundException($"Quiz with ID {quizId} not found.");
                }

                if (actor.IsTeacher && !actor.CanManageAll)
                {
                    await RequireActiveTeacherAsync(actor, cancellationToken);
                    if (quiz.Class.Teacher?.UserId != actor.UserId)
                    {
                        throw new ForbiddenException("You cannot create questions for another teacher's quiz.");
                    }
                }

                if (quiz.Status != QuizStatus.Draft)
                {
                    throw new ConflictException("Cannot add questions to a quiz that is not in Draft status.");
                }

                if (quiz.Class.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot add questions to a quiz in a completed class.");
                }

                if (quiz.Class.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot add questions to a quiz in a cancelled class.");
                }

                var hasAttempts = await _quizRepository.HasAttemptsAsync(quizId, cancellationToken);
                if (hasAttempts)
                {
                    throw new ConflictException("Cannot add questions to a quiz after student attempts exist.");
                }

                var currentMax = await _context.Questions
                    .Where(q => q.QuizId == quizId)
                    .MaxAsync(q => (int?)q.OrderIndex, cancellationToken) ?? -1;

                var nextOrder = currentMax + 1;
                var createdQuestions = new List<Question>();

                for (var i = 0; i < questions.Count; i++)
                {
                    var req = questions[i];
                    var question = new Question
                    {
                        QuizId = quizId,
                        Content = req.Content.Trim(),
                        QuestionType = req.QuestionType!.Value,
                        Score = req.Score!.Value,
                        OrderIndex = nextOrder + i,
                        CorrectTextAnswer = req.QuestionType.Value == QuestionType.FillInBlank
                            ? req.CorrectTextAnswer?.Trim()
                            : null
                    };

                    if (req.QuestionType.Value != QuestionType.FillInBlank && req.Options != null)
                    {
                        for (var j = 0; j < req.Options.Count; j++)
                        {
                            var opt = req.Options[j];
                            question.QuestionOptions.Add(new QuestionOption
                            {
                                Content = opt.Content.Trim(),
                                IsCorrect = opt.IsCorrect!.Value,
                                OrderIndex = j
                            });
                        }
                    }

                    await _quizRepository.AddQuestionAsync(question, cancellationToken);
                    createdQuestions.Add(question);
                }

                await _quizRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return createdQuestions.Select(MapToManagementResponse).ToList();
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt >= MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent modifications. Please try again.");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw;
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent modifications. Please try again.");
    }

    public async Task<QuestionManagementResponse> UpdateAsync(
        int quizId,
        int questionId,
        UpdateQuestionRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to update questions.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var quiz = await _quizRepository.GetByIdForUpdateAsync(quizId, cancellationToken);
            if (quiz == null)
            {
                throw new NotFoundException($"Quiz with ID {quizId} not found.");
            }

            if (actor.IsTeacher && !actor.CanManageAll)
            {
                await RequireActiveTeacherAsync(actor, cancellationToken);
                if (quiz.Class.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot update questions for another teacher's quiz.");
                }
            }

            if (quiz.Class.Status == ClassStatus.Completed)
            {
                throw new ValidationException("Cannot update questions in a completed class.");
            }

            if (quiz.Class.Status == ClassStatus.Cancelled)
            {
                throw new ValidationException("Cannot update questions in a cancelled class.");
            }

            var hasAttempts = await _quizRepository.HasAttemptsAsync(quizId, cancellationToken);
            if (hasAttempts)
            {
                throw new ConflictException("Cannot update questions after student attempts exist.");
            }

            var question = await _quizRepository.GetQuestionByIdAsync(questionId, cancellationToken);
            if (question == null || question.QuizId != quizId)
            {
                throw new NotFoundException($"Question with ID {questionId} not found in this quiz.");
            }

            question.Content = request.Content.Trim();
            question.QuestionType = request.QuestionType!.Value;
            question.Score = request.Score!.Value;
            question.OrderIndex = request.OrderIndex!.Value;
            question.CorrectTextAnswer = request.QuestionType.Value == QuestionType.FillInBlank
                ? request.CorrectTextAnswer?.Trim()
                : null;

            // Atomic full replacement of options
            if (question.QuestionOptions.Any())
            {
                _quizRepository.RemoveQuestionOptions(question.QuestionOptions);
            }

            if (request.QuestionType.Value != QuestionType.FillInBlank && request.Options != null)
            {
                foreach (var opt in request.Options)
                {
                    question.QuestionOptions.Add(new QuestionOption
                    {
                        QuestionId = question.Id,
                        Content = opt.Content.Trim(),
                        IsCorrect = opt.IsCorrect!.Value,
                        OrderIndex = opt.OrderIndex!.Value
                    });
                }
            }

            await _quizRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return MapToManagementResponse(question);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            _context.ChangeTracker.Clear();
            throw;
        }
    }

    public async Task DeleteAsync(
        int quizId,
        int questionId,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to delete questions.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(
            IsolationLevel.Serializable,
            cancellationToken);

        try
        {
            var quiz = await _quizRepository.GetByIdForUpdateAsync(quizId, cancellationToken);
            if (quiz == null)
            {
                throw new NotFoundException($"Quiz with ID {quizId} not found.");
            }

            if (actor.IsTeacher && !actor.CanManageAll)
            {
                await RequireActiveTeacherAsync(actor, cancellationToken);
                if (quiz.Class.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot delete questions for another teacher's quiz.");
                }
            }

            if (quiz.Class.Status == ClassStatus.Completed)
            {
                throw new ValidationException("Cannot delete questions in a completed class.");
            }

            if (quiz.Class.Status == ClassStatus.Cancelled)
            {
                throw new ValidationException("Cannot delete questions in a cancelled class.");
            }

            var hasAttempts = await _quizRepository.HasAttemptsAsync(quizId, cancellationToken);
            if (hasAttempts)
            {
                throw new ConflictException("Cannot delete questions after student attempts exist.");
            }

            var question = await _quizRepository.GetQuestionByIdAsync(questionId, cancellationToken);
            if (question == null || question.QuizId != quizId)
            {
                throw new NotFoundException($"Question with ID {questionId} not found in this quiz.");
            }

            if (question.QuestionOptions.Any())
            {
                _quizRepository.RemoveQuestionOptions(question.QuestionOptions);
            }

            _quizRepository.RemoveQuestion(question);
            await _quizRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            await transaction.RollbackAsync(cancellationToken);
            _context.ChangeTracker.Clear();
            throw new ConflictException("Cannot delete question after student attempts exist.");
        }
    }

    private static QuestionManagementResponse MapToManagementResponse(Question qn)
    {
        return new QuestionManagementResponse
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
        };
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

            if (exception.Message.Contains("1205") || exception.Message.Contains("1222") || exception.Message.Contains("deadlock", StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            exception = exception.InnerException;
        }

        return false;
    }
}
