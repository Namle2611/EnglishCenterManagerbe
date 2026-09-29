using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Lessons;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class LessonService : ILessonService
{
    private const int MaxConcurrencyRetries = 3;
    private readonly ILessonRepository _lessonRepository;
    private readonly AppDbContext _context;
    private readonly ILogger<LessonService> _logger;

    public LessonService(
        ILessonRepository lessonRepository,
        AppDbContext context,
        ILogger<LessonService> logger)
    {
        _lessonRepository = lessonRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<LessonListItemResponse>> GetListAsync(
        LessonQuery query,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        List<int>? allowedCourseIds = null;

        if (actor.IsTeacher && !actor.IsAdmin && !actor.IsStaff)
        {
            if (!await _lessonRepository.IsActiveTeacherAsync(actor.UserId, cancellationToken))
            {
                throw new ForbiddenException("An active Teacher profile is required.");
            }

            if (query.CourseId.HasValue)
            {
                var isAuthorized = await _lessonRepository.IsTeacherAuthorizedForCourseAsync(
                    actor.UserId, query.CourseId.Value, cancellationToken);
                if (!isAuthorized)
                {
                    // Check if course exists
                    var courseExists = await _context.Courses.AnyAsync(c => c.Id == query.CourseId.Value, cancellationToken);
                    if (!courseExists)
                    {
                        throw new NotFoundException($"Course with ID {query.CourseId.Value} not found.");
                    }

                    throw new ForbiddenException("You are not authorized to view learning content for this course.");
                }

                allowedCourseIds = [query.CourseId.Value];
            }
            else if (query.SectionId.HasValue)
            {
                var section = await _lessonRepository.GetSectionWithCourseAsync(query.SectionId.Value, cancellationToken);
                if (section == null)
                {
                    throw new NotFoundException($"Section with ID {query.SectionId.Value} not found.");
                }

                var isAuthorized = await _lessonRepository.IsTeacherAuthorizedForCourseAsync(
                    actor.UserId, section.CourseId, cancellationToken);
                if (!isAuthorized)
                {
                    throw new ForbiddenException("You are not authorized to view learning content for this section.");
                }

                allowedCourseIds = [section.CourseId];
            }
            else
            {
                allowedCourseIds = await _lessonRepository.GetTeacherAuthorizedCourseIdsAsync(
                    actor.UserId, cancellationToken);
            }
        }
        else
        {
            if (query.CourseId.HasValue)
            {
                var courseExists = await _context.Courses.AnyAsync(c => c.Id == query.CourseId.Value, cancellationToken);
                if (!courseExists)
                {
                    throw new NotFoundException($"Course with ID {query.CourseId.Value} not found.");
                }
            }

            if (query.SectionId.HasValue)
            {
                var sectionExists = await _lessonRepository.SectionExistsAsync(query.SectionId.Value, cancellationToken);
                if (!sectionExists)
                {
                    throw new NotFoundException($"Section with ID {query.SectionId.Value} not found.");
                }
            }
        }

        return await _lessonRepository.GetPagedAsync(query, allowedCourseIds, cancellationToken);
    }

    public async Task<LessonDetailResponse> GetDetailAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        var lesson = await _lessonRepository.GetByIdAsync(id, asNoTracking: true, cancellationToken);
        if (lesson == null)
        {
            throw new NotFoundException($"Lesson with ID {id} not found.");
        }

        if (actor.IsTeacher && !actor.IsAdmin && !actor.IsStaff)
        {
            if (!await _lessonRepository.IsActiveTeacherAsync(actor.UserId, cancellationToken))
            {
                throw new ForbiddenException("An active Teacher profile is required.");
            }

            var isAuthorized = await _lessonRepository.IsTeacherAuthorizedForCourseAsync(
                actor.UserId, lesson.Section.CourseId, cancellationToken);
            if (!isAuthorized)
            {
                throw new ForbiddenException("You are not authorized to view learning content for this lesson.");
            }
        }

        return (await _lessonRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<LessonDetailResponse> CreateAsync(
        CreateLessonRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        EnsureCanMutate(actor);

        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.SectionId.HasValue || request.SectionId.Value <= 0)
        {
            throw new ValidationException("SectionId must be greater than 0.");
        }

        var sectionId = request.SectionId.Value;
        var section = await _lessonRepository.GetSectionWithCourseAsync(sectionId, cancellationToken);
        if (section == null)
        {
            throw new NotFoundException($"Section with ID {sectionId} not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required.");
        }

        var trimmedTitle = request.Title.Trim();
        if (trimmedTitle.Length > 200)
        {
            throw new ValidationException("Title cannot exceed 200 characters.");
        }

        var content = string.IsNullOrWhiteSpace(request.Content) ? null : request.Content.Trim();
        var videoUrl = ValidateAndNormalizeUrl(request.VideoUrl, nameof(request.VideoUrl));
        var audioUrl = ValidateAndNormalizeUrl(request.AudioUrl, nameof(request.AudioUrl));
        var documentUrl = ValidateAndNormalizeUrl(request.DocumentUrl, nameof(request.DocumentUrl));

        var status = request.Status ?? LessonStatus.Draft;
        if (status == LessonStatus.Published)
        {
            ValidatePublishedContent(content, videoUrl, audioUrl, documentUrl);
        }

        int orderIndex;
        if (request.OrderIndex.HasValue)
        {
            if (request.OrderIndex.Value < 0)
            {
                throw new ValidationException("OrderIndex must be greater than or equal to 0.");
            }
            orderIndex = request.OrderIndex.Value;
        }
        else
        {
            var maxOrder = await _lessonRepository.GetMaxOrderIndexAsync(sectionId, cancellationToken);
            orderIndex = maxOrder >= 0 ? maxOrder + 1 : 0;
        }

        var normalizedTitle = trimmedTitle.ToLower();

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable, cancellationToken);
            try
            {
                if (await _lessonRepository.TitleExistsAsync(sectionId, normalizedTitle, excludeId: null, cancellationToken))
                {
                    throw new ConflictException($"A lesson with the title '{trimmedTitle}' already exists in this section.");
                }

                var lesson = new Lesson
                {
                    SectionId = sectionId,
                    Title = trimmedTitle,
                    Content = content,
                    VideoUrl = videoUrl,
                    AudioUrl = audioUrl,
                    DocumentUrl = documentUrl,
                    OrderIndex = orderIndex,
                    Status = status
                };

                await _lessonRepository.AddAsync(lesson, cancellationToken);
                await _lessonRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Lesson '{Title}' (ID: {LessonId}) created in Section {SectionId}.",
                    lesson.Title, lesson.Id, sectionId);

                return (await _lessonRepository.GetDetailByIdAsync(lesson.Id, cancellationToken))!;
            }
            catch (ConflictException)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
            catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new NotFoundException($"Section with ID {sectionId} not found.");
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogWarning(ex, "Transient concurrency contention on lesson creation (attempt {Attempt}). Retrying...", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    public async Task<LessonDetailResponse> UpdateAsync(
        int id,
        UpdateLessonRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        EnsureCanMutate(actor);

        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var lesson = await _lessonRepository.GetByIdAsync(id, asNoTracking: false, cancellationToken);
        if (lesson == null)
        {
            throw new NotFoundException($"Lesson with ID {id} not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            throw new ValidationException("Title is required.");
        }

        var trimmedTitle = request.Title.Trim();
        if (trimmedTitle.Length > 200)
        {
            throw new ValidationException("Title cannot exceed 200 characters.");
        }

        if (!request.OrderIndex.HasValue || request.OrderIndex.Value < 0)
        {
            throw new ValidationException("OrderIndex must be greater than or equal to 0.");
        }

        if (!request.Status.HasValue)
        {
            throw new ValidationException("Status is required.");
        }

        var content = string.IsNullOrWhiteSpace(request.Content) ? null : request.Content.Trim();
        var videoUrl = ValidateAndNormalizeUrl(request.VideoUrl, nameof(request.VideoUrl));
        var audioUrl = ValidateAndNormalizeUrl(request.AudioUrl, nameof(request.AudioUrl));
        var documentUrl = ValidateAndNormalizeUrl(request.DocumentUrl, nameof(request.DocumentUrl));
        var status = request.Status.Value;
        var orderIndex = request.OrderIndex.Value;

        if (status == LessonStatus.Published)
        {
            ValidatePublishedContent(content, videoUrl, audioUrl, documentUrl);
        }

        // Idempotency check
        if (string.Equals(lesson.Title, trimmedTitle, StringComparison.Ordinal) &&
            string.Equals(lesson.Content, content, StringComparison.Ordinal) &&
            string.Equals(lesson.VideoUrl, videoUrl, StringComparison.Ordinal) &&
            string.Equals(lesson.AudioUrl, audioUrl, StringComparison.Ordinal) &&
            string.Equals(lesson.DocumentUrl, documentUrl, StringComparison.Ordinal) &&
            lesson.OrderIndex == orderIndex &&
            lesson.Status == status)
        {
            return (await _lessonRepository.GetDetailByIdAsync(id, cancellationToken))!;
        }

        var titleChanged = !string.Equals(lesson.Title, trimmedTitle, StringComparison.OrdinalIgnoreCase);

        if (titleChanged)
        {
            var normalizedTitle = trimmedTitle.ToLower();

            for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable, cancellationToken);
                try
                {
                    if (await _lessonRepository.TitleExistsAsync(lesson.SectionId, normalizedTitle, excludeId: id, cancellationToken))
                    {
                        throw new ConflictException($"A lesson with the title '{trimmedTitle}' already exists in this section.");
                    }

                    lesson.Title = trimmedTitle;
                    lesson.Content = content;
                    lesson.VideoUrl = videoUrl;
                    lesson.AudioUrl = audioUrl;
                    lesson.DocumentUrl = documentUrl;
                    lesson.OrderIndex = orderIndex;
                    lesson.Status = status;

                    await _lessonRepository.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    _logger.LogInformation("Lesson ID {LessonId} updated with new title '{Title}'.", id, lesson.Title);
                    return (await _lessonRepository.GetDetailByIdAsync(id, cancellationToken))!;
                }
                catch (ConflictException)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
                catch (DbUpdateConcurrencyException)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw new NotFoundException($"Lesson with ID {id} not found.");
                }
                catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    _logger.LogWarning(ex, "Transient concurrency contention on lesson update (attempt {Attempt}). Retrying...", attempt + 1);
                    await Task.Delay(50 * (attempt + 1), cancellationToken);
                }
                catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
                }
            }

            throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
        }
        else
        {
            lesson.Title = trimmedTitle;
            lesson.Content = content;
            lesson.VideoUrl = videoUrl;
            lesson.AudioUrl = audioUrl;
            lesson.DocumentUrl = documentUrl;
            lesson.OrderIndex = orderIndex;
            lesson.Status = status;

            try
            {
                await _lessonRepository.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Lesson ID {LessonId} updated.", id);

                return (await _lessonRepository.GetDetailByIdAsync(id, cancellationToken))!;
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new NotFoundException($"Lesson with ID {id} not found.");
            }
        }
    }

    public async Task<LessonDetailResponse> UpdateStatusAsync(
        int id,
        UpdateLessonStatusRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        EnsureCanMutate(actor);

        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.Status.HasValue)
        {
            throw new ValidationException("Status is required.");
        }

        var lesson = await _lessonRepository.GetByIdAsync(id, asNoTracking: false, cancellationToken);
        if (lesson == null)
        {
            throw new NotFoundException($"Lesson with ID {id} not found.");
        }

        var newStatus = request.Status.Value;

        if (newStatus == LessonStatus.Published)
        {
            ValidatePublishedContent(lesson.Content, lesson.VideoUrl, lesson.AudioUrl, lesson.DocumentUrl);
        }

        if (lesson.Status == newStatus)
        {
            // Same-value status update: return current detail without redundant DB write
            return (await _lessonRepository.GetDetailByIdAsync(id, cancellationToken))!;
        }

        lesson.Status = newStatus;

        try
        {
            await _lessonRepository.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Lesson ID {LessonId} status updated to {Status}.", id, newStatus);

            return (await _lessonRepository.GetDetailByIdAsync(id, cancellationToken))!;
        }
        catch (DbUpdateConcurrencyException)
        {
            throw new NotFoundException($"Lesson with ID {id} not found.");
        }
    }

    public async Task DeleteAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        EnsureCanMutate(actor);

        var lesson = await _lessonRepository.GetByIdAsync(id, asNoTracking: false, cancellationToken);
        if (lesson == null)
        {
            throw new NotFoundException($"Lesson with ID {id} not found.");
        }

        _lessonRepository.Remove(lesson);
        await _lessonRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Lesson ID {LessonId} deleted successfully.", id);
    }

    private static void EnsureCanMutate(LearningContentActor actor)
    {
        if (!actor.IsAdmin && !actor.IsStaff)
        {
            throw new ForbiddenException("Only administrators and staff can modify lessons.");
        }
    }

    private static void ValidatePublishedContent(string? content, string? videoUrl, string? audioUrl, string? documentUrl)
    {
        var hasContent = !string.IsNullOrWhiteSpace(content);
        var hasVideo = !string.IsNullOrWhiteSpace(videoUrl);
        var hasAudio = !string.IsNullOrWhiteSpace(audioUrl);
        var hasDocument = !string.IsNullOrWhiteSpace(documentUrl);

        if (!hasContent && !hasVideo && !hasAudio && !hasDocument)
        {
            throw new ValidationException("A published lesson must contain text content or at least one resource URL.");
        }
    }

    private static string? ValidateAndNormalizeUrl(string? url, string fieldName)
    {
        if (string.IsNullOrWhiteSpace(url))
        {
            return null;
        }

        var trimmed = url.Trim();
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new ValidationException($"{fieldName} must be a valid absolute HTTP or HTTPS URL.");
        }

        return trimmed;
    }

    private static bool IsTransientException(Exception ex)
    {
        var current = ex;
        while (current != null)
        {
            if (current is SqlException sqlEx && (sqlEx.Number == 1205 || sqlEx.Number == -2 || sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                return true;
            }
            current = current.InnerException;
        }
        return false;
    }

    private static bool IsForeignKeyViolation(DbUpdateException ex)
    {
        var current = ex.InnerException;
        while (current != null)
        {
            if (current is SqlException sqlEx && sqlEx.Number == 547)
            {
                return true;
            }
            current = current.InnerException;
        }
        return false;
    }
}
