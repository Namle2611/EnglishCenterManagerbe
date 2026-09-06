using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Courses;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;

namespace EnglishCenter.Api.Services;

public class CourseService : ICourseService
{
    private readonly ICourseRepository _courseRepository;
    private readonly ILogger<CourseService> _logger;

    public CourseService(
        ICourseRepository courseRepository,
        ILogger<CourseService> logger)
    {
        _courseRepository = courseRepository;
        _logger = logger;
    }

    public async Task<PagedResult<CourseListItemResponse>> GetListAsync(CourseQuery query, CancellationToken cancellationToken = default)
    {
        return await _courseRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<CourseDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var course = await _courseRepository.GetByIdAsync(id, asNoTracking: true, cancellationToken);
        if (course == null)
        {
            throw new NotFoundException($"Course with ID {id} not found.");
        }

        return MapToDetailResponse(course);
    }

    public async Task<CourseDetailResponse> CreateAsync(CreateCourseRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var courseCode = request.CourseCode.Trim();
        var courseName = request.CourseName.Trim();
        var description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        var level = string.IsNullOrWhiteSpace(request.Level) ? null : request.Level.Trim();

        if (await _courseRepository.CourseCodeExistsAsync(courseCode, cancellationToken))
        {
            throw new ConflictException($"Course with code '{courseCode}' already exists.");
        }

        var course = new Course
        {
            CourseCode = courseCode,
            CourseName = courseName,
            Description = description,
            Level = level,
            DurationMonths = request.DurationMonths!.Value,
            TuitionFee = request.TuitionFee!.Value,
            Status = CourseStatus.Active
        };

        // Single-row write using EF Core atomic SaveChangesAsync, no explicit transaction required
        await _courseRepository.AddAsync(course, cancellationToken);
        await _courseRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Course '{CourseCode}' (ID: {CourseId}) created successfully.", course.CourseCode, course.Id);

        return MapToDetailResponse(course);
    }

    public async Task<CourseDetailResponse> UpdateAsync(int id, UpdateCourseRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var course = await _courseRepository.GetByIdAsync(id, asNoTracking: false, cancellationToken);
        if (course == null)
        {
            throw new NotFoundException($"Course with ID {id} not found.");
        }

        // Update mutable fields only; CourseCode and Status remain untouched
        course.CourseName = request.CourseName.Trim();
        course.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        course.Level = string.IsNullOrWhiteSpace(request.Level) ? null : request.Level.Trim();
        course.DurationMonths = request.DurationMonths!.Value;
        course.TuitionFee = request.TuitionFee!.Value;

        // Single-row update using EF Core atomic SaveChangesAsync, no explicit transaction required
        await _courseRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Course '{CourseCode}' (ID: {CourseId}) updated successfully.", course.CourseCode, course.Id);

        return MapToDetailResponse(course);
    }

    public async Task<CourseDetailResponse> UpdateStatusAsync(int id, UpdateCourseStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var course = await _courseRepository.GetByIdAsync(id, asNoTracking: false, cancellationToken);
        if (course == null)
        {
            throw new NotFoundException($"Course with ID {id} not found.");
        }

        var newStatus = request.Status!.Value;

        // Idempotent check: if status is unchanged, return current detail without writing
        if (course.Status == newStatus)
        {
            return MapToDetailResponse(course);
        }

        course.Status = newStatus;
        await _courseRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Course '{CourseCode}' (ID: {CourseId}) status updated to {Status}.", course.CourseCode, course.Id, newStatus);

        return MapToDetailResponse(course);
    }

    private static CourseDetailResponse MapToDetailResponse(Course course)
    {
        return new CourseDetailResponse
        {
            Id = course.Id,
            CourseCode = course.CourseCode,
            CourseName = course.CourseName,
            Description = course.Description,
            Level = course.Level,
            DurationMonths = course.DurationMonths,
            TuitionFee = course.TuitionFee,
            Status = course.Status
        };
    }
}
