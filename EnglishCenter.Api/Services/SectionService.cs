using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Sections;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class SectionService : ISectionService
{
    private const int MaxConcurrencyRetries = 3;
    private readonly ISectionRepository _sectionRepository;
    private readonly AppDbContext _context;
    private readonly ILogger<SectionService> _logger;

    public SectionService(
        ISectionRepository sectionRepository,
        AppDbContext context,
        ILogger<SectionService> logger)
    {
        _sectionRepository = sectionRepository;
        _context = context;
        _logger = logger;
    }

    public async Task<PagedResult<SectionListItemResponse>> GetListAsync(
        SectionQuery query,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        List<int>? allowedCourseIds = null;

        if (actor.IsTeacher && !actor.IsAdmin && !actor.IsStaff)
        {
            if (!await _sectionRepository.IsActiveTeacherAsync(actor.UserId, cancellationToken))
            {
                throw new ForbiddenException("An active Teacher profile is required.");
            }

            if (query.CourseId.HasValue)
            {
                var courseExists = await _sectionRepository.CourseExistsAsync(query.CourseId.Value, cancellationToken);
                if (!courseExists)
                {
                    throw new NotFoundException($"Course with ID {query.CourseId.Value} not found.");
                }

                var isAuthorized = await _sectionRepository.IsTeacherAuthorizedForCourseAsync(
                    actor.UserId, query.CourseId.Value, cancellationToken);
                if (!isAuthorized)
                {
                    throw new ForbiddenException("You are not authorized to view learning content for this course.");
                }

                allowedCourseIds = [query.CourseId.Value];
            }
            else
            {
                allowedCourseIds = await _sectionRepository.GetTeacherAuthorizedCourseIdsAsync(
                    actor.UserId, cancellationToken);
            }
        }
        else if (query.CourseId.HasValue)
        {
            var courseExists = await _sectionRepository.CourseExistsAsync(query.CourseId.Value, cancellationToken);
            if (!courseExists)
            {
                throw new NotFoundException($"Course with ID {query.CourseId.Value} not found.");
            }
        }

        return await _sectionRepository.GetPagedAsync(query, allowedCourseIds, cancellationToken);
    }

    public async Task<SectionDetailResponse> GetDetailAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        var section = await _sectionRepository.GetByIdAsync(id, asNoTracking: true, cancellationToken);
        if (section == null)
        {
            throw new NotFoundException($"Section with ID {id} not found.");
        }

        if (actor.IsTeacher && !actor.IsAdmin && !actor.IsStaff)
        {
            if (!await _sectionRepository.IsActiveTeacherAsync(actor.UserId, cancellationToken))
            {
                throw new ForbiddenException("An active Teacher profile is required.");
            }

            var isAuthorized = await _sectionRepository.IsTeacherAuthorizedForCourseAsync(
                actor.UserId, section.CourseId, cancellationToken);
            if (!isAuthorized)
            {
                throw new ForbiddenException("You are not authorized to view learning content for this section.");
            }
        }

        return (await _sectionRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<CourseSyllabusResponse> GetCourseSyllabusAsync(
        int courseId,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        var courseExists = await _sectionRepository.CourseExistsAsync(courseId, cancellationToken);
        if (!courseExists)
        {
            throw new NotFoundException($"Course with ID {courseId} not found.");
        }

        if (actor.IsTeacher && !actor.IsAdmin && !actor.IsStaff)
        {
            if (!await _sectionRepository.IsActiveTeacherAsync(actor.UserId, cancellationToken))
            {
                throw new ForbiddenException("An active Teacher profile is required.");
            }

            var isAuthorized = await _sectionRepository.IsTeacherAuthorizedForCourseAsync(
                actor.UserId, courseId, cancellationToken);
            if (!isAuthorized)
            {
                throw new ForbiddenException("You are not authorized to view learning content for this course.");
            }
        }

        var course = await _sectionRepository.GetCourseWithSyllabusAsync(courseId, cancellationToken);
        if (course == null)
        {
            throw new NotFoundException($"Course with ID {courseId} not found.");
        }

        return new CourseSyllabusResponse
        {
            CourseId = course.Id,
            CourseCode = course.CourseCode,
            CourseName = course.CourseName,
            Level = course.Level,
            Sections = course.Sections.Select(s => new SyllabusSectionItem
            {
                Id = s.Id,
                Title = s.Title,
                Description = s.Description,
                OrderIndex = s.OrderIndex,
                Lessons = s.Lessons.Select(l => new SyllabusLessonItem
                {
                    Id = l.Id,
                    Title = l.Title,
                    Content = l.Content,
                    VideoUrl = l.VideoUrl,
                    AudioUrl = l.AudioUrl,
                    DocumentUrl = l.DocumentUrl,
                    OrderIndex = l.OrderIndex,
                    Status = l.Status
                }).ToList()
            }).ToList()
        };
    }

    public async Task<SectionDetailResponse> CreateAsync(
        CreateSectionRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        EnsureCanMutate(actor);

        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.CourseId.HasValue || request.CourseId.Value <= 0)
        {
            throw new ValidationException("CourseId must be greater than 0.");
        }

        var courseId = request.CourseId.Value;
        var courseExists = await _sectionRepository.CourseExistsAsync(courseId, cancellationToken);
        if (!courseExists)
        {
            throw new NotFoundException($"Course with ID {courseId} not found.");
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

        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();

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
            var maxOrder = await _sectionRepository.GetMaxOrderIndexAsync(courseId, cancellationToken);
            orderIndex = maxOrder >= 0 ? maxOrder + 1 : 0;
        }

        var normalizedTitle = trimmedTitle.ToLower();

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable, cancellationToken);
            try
            {
                if (await _sectionRepository.TitleExistsAsync(courseId, normalizedTitle, excludeId: null, cancellationToken))
                {
                    throw new ConflictException($"A section with the title '{trimmedTitle}' already exists in this course.");
                }

                var section = new Section
                {
                    CourseId = courseId,
                    Title = trimmedTitle,
                    Description = description,
                    OrderIndex = orderIndex
                };

                await _sectionRepository.AddAsync(section, cancellationToken);
                await _sectionRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Section '{Title}' (ID: {SectionId}) created in Course {CourseId}.",
                    section.Title, section.Id, courseId);

                return (await _sectionRepository.GetDetailByIdAsync(section.Id, cancellationToken))!;
            }
            catch (ConflictException)
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
            catch (DbUpdateException ex) when (IsForeignKeyViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                throw new NotFoundException($"Course with ID {courseId} not found.");
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _logger.LogWarning(ex, "Transient concurrency contention on section creation (attempt {Attempt}). Retrying...", attempt + 1);
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

    public async Task<SectionDetailResponse> UpdateAsync(
        int id,
        UpdateSectionRequest request,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        EnsureCanMutate(actor);

        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var section = await _sectionRepository.GetByIdAsync(id, asNoTracking: false, cancellationToken);
        if (section == null)
        {
            throw new NotFoundException($"Section with ID {id} not found.");
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

        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        var newOrderIndex = request.OrderIndex.Value;

        // Check idempotency
        if (string.Equals(section.Title, trimmedTitle, StringComparison.Ordinal) &&
            string.Equals(section.Description, description, StringComparison.Ordinal) &&
            section.OrderIndex == newOrderIndex)
        {
            return (await _sectionRepository.GetDetailByIdAsync(id, cancellationToken))!;
        }

        var titleChanged = !string.Equals(section.Title, trimmedTitle, StringComparison.OrdinalIgnoreCase);

        if (titleChanged)
        {
            var normalizedTitle = trimmedTitle.ToLower();

            for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
            {
                await using var transaction = await _context.Database.BeginTransactionAsync(
                    IsolationLevel.Serializable, cancellationToken);
                try
                {
                    if (await _sectionRepository.TitleExistsAsync(section.CourseId, normalizedTitle, excludeId: id, cancellationToken))
                    {
                        throw new ConflictException($"A section with the title '{trimmedTitle}' already exists in this course.");
                    }

                    section.Title = trimmedTitle;
                    section.Description = description;
                    section.OrderIndex = newOrderIndex;

                    await _sectionRepository.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);

                    _logger.LogInformation("Section ID {SectionId} updated with new title '{Title}'.", id, section.Title);
                    return (await _sectionRepository.GetDetailByIdAsync(id, cancellationToken))!;
                }
                catch (ConflictException)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw;
                }
                catch (DbUpdateConcurrencyException)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    throw new NotFoundException($"Section with ID {id} not found.");
                }
                catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
                {
                    await transaction.RollbackAsync(cancellationToken);
                    _logger.LogWarning(ex, "Transient concurrency contention on section update (attempt {Attempt}). Retrying...", attempt + 1);
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
            section.Title = trimmedTitle;
            section.Description = description;
            section.OrderIndex = newOrderIndex;

            try
            {
                await _sectionRepository.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Section ID {SectionId} updated.", id);

                return (await _sectionRepository.GetDetailByIdAsync(id, cancellationToken))!;
            }
            catch (DbUpdateConcurrencyException)
            {
                throw new NotFoundException($"Section with ID {id} not found.");
            }
        }
    }

    public async Task DeleteAsync(
        int id,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        EnsureCanMutate(actor);

        var section = await _sectionRepository.GetByIdAsync(id, asNoTracking: false, cancellationToken);
        if (section == null)
        {
            throw new NotFoundException($"Section with ID {id} not found.");
        }

        var hasLessons = await _sectionRepository.HasLessonsAsync(id, cancellationToken);
        if (hasLessons)
        {
            throw new ValidationException("Cannot delete section because it contains lessons. Please delete all lessons first.");
        }

        try
        {
            _sectionRepository.Remove(section);
            await _sectionRepository.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Section ID {SectionId} deleted successfully.", id);
        }
        catch (DbUpdateException ex)
        {
            _logger.LogWarning(ex, "DbUpdateException on deleting section ID {SectionId}. Child lessons may exist.", id);
            throw new ValidationException("Cannot delete section because it contains lessons. Please delete all lessons first.");
        }
    }

    public async Task<PagedResult<TeacherCourseLookupItemResponse>> GetTeacherCoursesLookupAsync(
        TeacherCourseLookupQuery query,
        LearningContentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsTeacher)
        {
            throw new ForbiddenException("Only teachers can access this course lookup.");
        }

        if (!await _sectionRepository.IsActiveTeacherAsync(actor.UserId, cancellationToken))
        {
            throw new ForbiddenException("An active Teacher profile is required.");
        }

        return await _sectionRepository.GetTeacherCoursesLookupAsync(query, actor.UserId, cancellationToken);
    }

    private static void EnsureCanMutate(LearningContentActor actor)
    {
        if (!actor.IsAdmin && !actor.IsStaff)
        {
            throw new ForbiddenException("Only administrators and staff can modify course sections.");
        }
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
