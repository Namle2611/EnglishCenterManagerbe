using System.Collections.Concurrent;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.QuizAi;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class QuizAiException : Exception
{
    public int StatusCode { get; }

    public QuizAiException(int statusCode, string message) : base(message)
    {
        StatusCode = statusCode;
    }
}

public class QuizAiService : IQuizAiService
{
    private static readonly ConcurrentDictionary<int, byte> _activeGenerations = new();
    private static readonly ConcurrentDictionary<int, List<DateTime>> _generationHistory = new();

    public static void ResetRateLimits()
    {
        _activeGenerations.Clear();
        _generationHistory.Clear();
    }

    private readonly AppDbContext _context;
    private readonly IQuizRepository _quizRepository;
    private readonly ILessonRepository _lessonRepository;
    private readonly IQuizQuestionService _quizQuestionService;
    private readonly IGeminiQuizClient _geminiClient;
    private readonly ILogger<QuizAiService> _logger;

    public QuizAiService(
        AppDbContext context,
        IQuizRepository quizRepository,
        ILessonRepository lessonRepository,
        IQuizQuestionService quizQuestionService,
        IGeminiQuizClient geminiClient,
        ILogger<QuizAiService> logger)
    {
        _context = context;
        _quizRepository = quizRepository;
        _lessonRepository = lessonRepository;
        _quizQuestionService = quizQuestionService;
        _geminiClient = geminiClient;
        _logger = logger;
    }

    public async Task<GeneratedQuizQuestionsResponse> GenerateQuestionsAsync(
        int quizId,
        GenerateQuizQuestionsRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to generate quiz questions.");
        }

        if (!actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Only teachers, staff, and administrators can manage quizzes.");
        }

        // 1. Rate Limiting Checks (Application-level, In-Memory)
        if (!_activeGenerations.TryAdd(actor.UserId, 0))
        {
            throw new QuizAiException(
                StatusCodes.Status429TooManyRequests,
                "An AI question generation request is already in progress for your account. Please wait for it to complete.");
        }

        try
        {
            var tenMinutesAgo = DateTime.UtcNow.AddMinutes(-10);
            _generationHistory.AddOrUpdate(
                actor.UserId,
                _ => new List<DateTime> { DateTime.UtcNow },
                (_, list) =>
                {
                    lock (list)
                    {
                        list.RemoveAll(d => d < tenMinutesAgo);
                        if (list.Count >= 10)
                        {
                            throw new QuizAiException(
                                StatusCodes.Status429TooManyRequests,
                                "Generation rate limit exceeded. You may make at most 10 requests per 10 minutes.");
                        }
                        list.Add(DateTime.UtcNow);
                        return list;
                    }
                });

            // 2. Validate Quiz State
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
                    throw new ForbiddenException("You cannot generate questions for another teacher's quiz.");
                }
            }

            if (quiz.Status != QuizStatus.Draft)
            {
                throw new ValidationException("Cannot generate questions for a quiz that is not in Draft status.");
            }

            if (quiz.Class.Status == ClassStatus.Completed)
            {
                throw new ValidationException("Cannot generate questions for a quiz in a completed class.");
            }

            if (quiz.Class.Status == ClassStatus.Cancelled)
            {
                throw new ValidationException("Cannot generate questions for a quiz in a cancelled class.");
            }

            var hasAttempts = await _quizRepository.HasAttemptsAsync(quizId, cancellationToken);
            if (hasAttempts)
            {
                throw new ConflictException("Cannot generate questions for a quiz after student attempts exist.");
            }

            // 3. Resolve Source Content
            string sourceText;
            string sourceSummary;
            var warnings = new List<string>();

            if (request.SourceType == QuizAiSourceType.Topic)
            {
                sourceText = request.Topic!;
                sourceSummary = $"Topic: {request.Topic}";
            }
            else
            {
                var lesson = await _lessonRepository.GetByIdAsync(request.LessonId!.Value, cancellationToken: cancellationToken);
                if (lesson == null)
                {
                    throw new NotFoundException($"Lesson with ID {request.LessonId.Value} not found.");
                }

                if (lesson.Section.CourseId != quiz.Class.CourseId)
                {
                    throw new ValidationException("Selected lesson does not belong to the same course as this quiz.");
                }

                if (actor.IsTeacher && !actor.CanManageAll)
                {
                    var isAuthorized = await _lessonRepository.IsTeacherAuthorizedForCourseAsync(
                        actor.UserId, lesson.Section.CourseId, cancellationToken);
                    if (!isAuthorized)
                    {
                        throw new ForbiddenException("You are not authorized to view learning content for this course.");
                    }
                }

                if (string.IsNullOrWhiteSpace(lesson.Content))
                {
                    throw new ValidationException("Selected lesson contains no textual content for question generation.");
                }

                var content = lesson.Content.Trim();
                if (content.Length > 15000)
                {
                    content = TruncateContentAtSafeBoundary(content, 15000);
                    warnings.Add("Lesson source was truncated for AI generation as it exceeded 15,000 characters.");
                    sourceSummary = $"Lesson: {lesson.Title} (Truncated to {content.Length} characters)";
                }
                else
                {
                    sourceSummary = $"Lesson: {lesson.Title}";
                }

                sourceText = content;
            }

            // 4. Provider Call Budget (Max 2 calls per Generate request)
            var promptContext = new GeminiGeneratePromptContext
            {
                SourceType = request.SourceType!.Value,
                SourceText = sourceText,
                QuestionCount = request.QuestionCount,
                QuestionTypes = request.QuestionTypes!,
                Difficulty = request.Difficulty,
                Language = request.Language,
                AdditionalInstructions = request.AdditionalInstructions
            };

            var providerCalls = 1;
            var result = await _geminiClient.GenerateQuestionsAsync(promptContext, cancellationToken);

            // Handle immediate non-retryable failures
            if (result.IsAuthError)
            {
                throw new QuizAiException(
                    StatusCodes.Status503ServiceUnavailable,
                    "AI Quiz Generation service is not configured or unavailable.");
            }

            if (result.IsSafetyBlocked)
            {
                throw new QuizAiException(
                    StatusCodes.Status422UnprocessableEntity,
                    "The requested content could not be processed due to safety policy guidelines. Please adjust your topic, lesson, or instructions.");
            }

            // Check if transient error occurred on Call #1
            if (result.IsTransientError)
            {
                if (providerCalls < 2)
                {
                    _logger.LogInformation("Transient provider error on Call #1. Retrying once (Call #2)...");
                    await Task.Delay(1000, cancellationToken);
                    providerCalls++;
                    result = await _geminiClient.GenerateQuestionsAsync(promptContext, cancellationToken);

                    if (result.IsAuthError)
                    {
                        throw new QuizAiException(
                            StatusCodes.Status503ServiceUnavailable,
                            "AI Quiz Generation service is not configured or unavailable.");
                    }

                    if (result.IsSafetyBlocked)
                    {
                        throw new QuizAiException(
                            StatusCodes.Status422UnprocessableEntity,
                            "The requested content could not be processed due to safety policy guidelines. Please adjust your topic, lesson, or instructions.");
                    }

                    if (result.IsTransientError)
                    {
                        if (result.ErrorMessage?.Contains("rate limit", StringComparison.OrdinalIgnoreCase) == true)
                        {
                            throw new QuizAiException(StatusCodes.Status429TooManyRequests, "AI provider rate limit exceeded. Please try again shortly.");
                        }

                        if (result.ErrorMessage?.Contains("timed out", StringComparison.OrdinalIgnoreCase) == true)
                        {
                            throw new QuizAiException(StatusCodes.Status504GatewayTimeout, "AI generation request timed out. Please try again.");
                        }

                        throw new QuizAiException(StatusCodes.Status502BadGateway, "AI provider service is temporarily unavailable.");
                    }

                    if (!result.IsSuccess || result.IsTruncated)
                    {
                        throw new QuizAiException(
                            StatusCodes.Status422UnprocessableEntity,
                            "AI model produced an invalid response following retry.");
                    }
                }
                else
                {
                    throw new QuizAiException(StatusCodes.Status502BadGateway, "AI provider service is temporarily unavailable.");
                }
            }

            // At this point, we evaluate output validity & question count
            var validQuestions = ValidateAndConvertQuestions(result.Questions, request);

            // If Call #1 produced truncated, malformed, or wrong count output -> use repair retry (Call #2)
            if ((!result.IsSuccess || result.IsTruncated || validQuestions.Count != request.QuestionCount) && providerCalls < 2)
            {
                _logger.LogInformation(
                    "Call #1 output repair needed (Truncated={Truncated}, Success={Success}, Count={Count}/{Expected}). Attempting Call #2 repair...",
                    result.IsTruncated, result.IsSuccess, validQuestions.Count, request.QuestionCount);

                providerCalls++;
                result = await _geminiClient.GenerateQuestionsAsync(promptContext, cancellationToken);

                if (result.IsAuthError)
                {
                    throw new QuizAiException(StatusCodes.Status503ServiceUnavailable, "AI Quiz Generation service is not configured or unavailable.");
                }

                if (result.IsSafetyBlocked)
                {
                    throw new QuizAiException(StatusCodes.Status422UnprocessableEntity, "The requested content could not be processed due to safety policy guidelines.");
                }

                if (!result.IsSuccess || result.IsTruncated)
                {
                    throw new QuizAiException(
                        StatusCodes.Status422UnprocessableEntity,
                        "AI model produced an invalid or truncated response after repair.");
                }

                validQuestions = ValidateAndConvertQuestions(result.Questions, request);
            }

            // Final exact usable question count validation
            if (validQuestions.Count != request.QuestionCount)
            {
                throw new QuizAiException(
                    StatusCodes.Status422UnprocessableEntity,
                    $"The AI model failed to produce the exact requested question count of valid questions (Produced {validQuestions.Count}, requested {request.QuestionCount}).");
            }

            return new GeneratedQuizQuestionsResponse
            {
                QuizId = quizId,
                SourceType = request.SourceType.Value,
                SourceSummary = sourceSummary,
                Questions = validQuestions,
                Warnings = warnings
            };
        }
        finally
        {
            _activeGenerations.TryRemove(actor.UserId, out _);
        }
    }

    public async Task<List<QuestionManagementResponse>> ApplyQuestionsAsync(
        int quizId,
        ApplyGeneratedQuestionsRequest request,
        QuizActor actor,
        CancellationToken cancellationToken = default)
    {
        return await _quizQuestionService.CreateBulkAsync(quizId, request.Questions, actor, cancellationToken);
    }

    private static List<GeneratedQuizQuestionItemResponse> ValidateAndConvertQuestions(
        List<GeminiGeneratedQuestionRawItem> rawItems,
        GenerateQuizQuestionsRequest request)
    {
        var validList = new List<GeneratedQuizQuestionItemResponse>();
        if (rawItems == null || rawItems.Count == 0) return validList;

        var allowedTypes = (request.QuestionTypes != null && request.QuestionTypes.Count > 0)
            ? request.QuestionTypes.ToHashSet()
            : new HashSet<QuestionType> { QuestionType.MultipleChoice, QuestionType.TrueFalse, QuestionType.FillInBlank };

        for (var i = 0; i < rawItems.Count; i++)
        {
            var raw = rawItems[i];
            if (string.IsNullOrWhiteSpace(raw.Content)) continue;
            if (!Enum.TryParse<QuestionType>(raw.QuestionType, true, out var qType)) continue;
            if (!allowedTypes.Contains(qType)) continue;

            if (qType == QuestionType.MultipleChoice)
            {
                if (raw.Options == null || raw.Options.Count < 2) continue;
                if (raw.Options.Any(o => string.IsNullOrWhiteSpace(o.Content))) continue;
                if (raw.Options.Count(o => o.IsCorrect) != 1) continue;

                validList.Add(new GeneratedQuizQuestionItemResponse
                {
                    TempId = Guid.NewGuid().ToString("N"),
                    Content = raw.Content.Trim(),
                    QuestionType = qType,
                    Score = request.ScorePerQuestion,
                    OrderIndex = validList.Count,
                    Options = raw.Options.Select((o, idx) => new GeneratedQuizOptionItemResponse
                    {
                        Content = o.Content.Trim(),
                        IsCorrect = o.IsCorrect,
                        OrderIndex = idx
                    }).ToList(),
                    CorrectTextAnswer = null,
                    Explanation = string.IsNullOrWhiteSpace(raw.Explanation) ? null : raw.Explanation.Trim()
                });
            }
            else if (qType == QuestionType.TrueFalse)
            {
                if (raw.Options == null || raw.Options.Count != 2) continue;
                if (raw.Options.Any(o => string.IsNullOrWhiteSpace(o.Content))) continue;
                if (raw.Options.Count(o => o.IsCorrect) != 1) continue;

                validList.Add(new GeneratedQuizQuestionItemResponse
                {
                    TempId = Guid.NewGuid().ToString("N"),
                    Content = raw.Content.Trim(),
                    QuestionType = qType,
                    Score = request.ScorePerQuestion,
                    OrderIndex = validList.Count,
                    Options = raw.Options.Select((o, idx) => new GeneratedQuizOptionItemResponse
                    {
                        Content = o.Content.Trim(),
                        IsCorrect = o.IsCorrect,
                        OrderIndex = idx
                    }).ToList(),
                    CorrectTextAnswer = null,
                    Explanation = string.IsNullOrWhiteSpace(raw.Explanation) ? null : raw.Explanation.Trim()
                });
            }
            else if (qType == QuestionType.FillInBlank)
            {
                if (raw.Options != null && raw.Options.Count > 0) continue;
                if (string.IsNullOrWhiteSpace(raw.CorrectTextAnswer)) continue;

                validList.Add(new GeneratedQuizQuestionItemResponse
                {
                    TempId = Guid.NewGuid().ToString("N"),
                    Content = raw.Content.Trim(),
                    QuestionType = qType,
                    Score = request.ScorePerQuestion,
                    OrderIndex = validList.Count,
                    Options = null,
                    CorrectTextAnswer = raw.CorrectTextAnswer.Trim(),
                    Explanation = string.IsNullOrWhiteSpace(raw.Explanation) ? null : raw.Explanation.Trim()
                });
            }
        }

        return validList;
    }

    private static string TruncateContentAtSafeBoundary(string text, int maxLength)
    {
        if (text.Length <= maxLength) return text;
        var truncated = text[..maxLength];
        var lastBoundary = truncated.LastIndexOfAny(new[] { '.', '!', '?', '\n' });
        if (lastBoundary > maxLength / 2)
        {
            return truncated[..(lastBoundary + 1)].Trim();
        }
        return truncated.Trim();
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
