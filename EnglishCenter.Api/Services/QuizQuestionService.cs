using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class QuizQuestionService : IQuizQuestionService
{
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
}
