using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.DTOs.Classes;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;

namespace EnglishCenter.Api.Services;

public class ClassService : IClassService
{
    private readonly IClassRepository _classRepository;
    private readonly ILogger<ClassService> _logger;

    public ClassService(
        IClassRepository classRepository,
        ILogger<ClassService> logger)
    {
        _classRepository = classRepository;
        _logger = logger;
    }

    public async Task<PagedResult<ClassListItemResponse>> GetListAsync(ClassQuery query, CancellationToken cancellationToken = default)
    {
        return await _classRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<PagedResult<TeacherLookupItemResponse>> GetTeacherLookupAsync(TeacherLookupQuery query, CancellationToken cancellationToken = default)
    {
        return await _classRepository.GetTeacherLookupAsync(query, cancellationToken);
    }

    public async Task<ClassDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var classDetail = await _classRepository.GetDetailByIdAsync(id, cancellationToken);
        if (classDetail == null)
        {
            throw new NotFoundException($"Class with ID {id} not found.");
        }

        return classDetail;
    }

    public async Task<ClassDetailResponse> CreateAsync(CreateClassRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var classCode = request.ClassCode.Trim();
        if (string.IsNullOrWhiteSpace(classCode))
        {
            throw new ValidationException("ClassCode is required.");
        }

        if (request.EndDate!.Value <= request.StartDate!.Value)
        {
            throw new ValidationException("EndDate must be strictly after StartDate.");
        }

        if (request.MaxStudents!.Value <= 0)
        {
            throw new ValidationException("MaxStudents must be greater than 0.");
        }

        if (await _classRepository.ClassCodeExistsAsync(classCode, cancellationToken))
        {
            throw new ConflictException($"Class with code '{classCode}' already exists.");
        }

        if (!await _classRepository.CourseExistsAsync(request.CourseId!.Value, cancellationToken))
        {
            throw new NotFoundException($"Course with ID {request.CourseId.Value} not found.");
        }

        if (request.TeacherId.HasValue && !await _classRepository.TeacherExistsAsync(request.TeacherId.Value, cancellationToken))
        {
            throw new NotFoundException($"Teacher with ID {request.TeacherId.Value} not found.");
        }

        var courseClass = new CourseClass
        {
            ClassCode = classCode,
            CourseId = request.CourseId!.Value,
            TeacherId = request.TeacherId,
            StartDate = request.StartDate!.Value,
            EndDate = request.EndDate!.Value,
            MaxStudents = request.MaxStudents!.Value,
            Status = ClassStatus.Planned // Explicit application default
        };

        // Single-row write using EF Core atomic SaveChangesAsync, no explicit transaction required
        await _classRepository.AddAsync(courseClass, cancellationToken);
        await _classRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Class '{ClassCode}' (ID: {ClassId}) created successfully.", courseClass.ClassCode, courseClass.Id);

        var result = await _classRepository.GetDetailByIdAsync(courseClass.Id, cancellationToken);
        return result!;
    }

    public async Task<ClassDetailResponse> UpdateAsync(int id, UpdateClassRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        var courseClass = await _classRepository.GetByIdTrackedAsync(id, cancellationToken);
        if (courseClass == null)
        {
            throw new NotFoundException($"Class with ID {id} not found.");
        }

        if (request.EndDate!.Value <= request.StartDate!.Value)
        {
            throw new ValidationException("EndDate must be strictly after StartDate.");
        }

        if (request.MaxStudents!.Value <= 0)
        {
            throw new ValidationException("MaxStudents must be greater than 0.");
        }

        if (!await _classRepository.CourseExistsAsync(request.CourseId!.Value, cancellationToken))
        {
            throw new NotFoundException($"Course with ID {request.CourseId.Value} not found.");
        }

        if (request.TeacherId.HasValue && !await _classRepository.TeacherExistsAsync(request.TeacherId.Value, cancellationToken))
        {
            throw new NotFoundException($"Teacher with ID {request.TeacherId.Value} not found.");
        }

        // Update mutable fields only; ClassCode and Status remain untouched
        courseClass.CourseId = request.CourseId!.Value;
        courseClass.TeacherId = request.TeacherId;
        courseClass.StartDate = request.StartDate!.Value;
        courseClass.EndDate = request.EndDate!.Value;
        courseClass.MaxStudents = request.MaxStudents!.Value;

        // Single-row update using EF Core atomic SaveChangesAsync, no explicit transaction required
        await _classRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Class '{ClassCode}' (ID: {ClassId}) updated successfully.", courseClass.ClassCode, courseClass.Id);

        var result = await _classRepository.GetDetailByIdAsync(id, cancellationToken);
        return result!;
    }

    public async Task<ClassDetailResponse> UpdateStatusAsync(int id, UpdateClassStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.Status.HasValue || !Enum.IsDefined(typeof(ClassStatus), request.Status.Value))
        {
            throw new ValidationException("Invalid class status.");
        }

        var courseClass = await _classRepository.GetByIdTrackedAsync(id, cancellationToken);
        if (courseClass == null)
        {
            throw new NotFoundException($"Class with ID {id} not found.");
        }

        var newStatus = request.Status.Value;

        // Idempotent check: if status is unchanged, return current detail without writing
        if (courseClass.Status == newStatus)
        {
            var current = await _classRepository.GetDetailByIdAsync(id, cancellationToken);
            return current!;
        }

        courseClass.Status = newStatus;
        await _classRepository.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Class '{ClassCode}' (ID: {ClassId}) status updated to {Status}.", courseClass.ClassCode, courseClass.Id, newStatus);

        var result = await _classRepository.GetDetailByIdAsync(id, cancellationToken);
        return result!;
    }
}
