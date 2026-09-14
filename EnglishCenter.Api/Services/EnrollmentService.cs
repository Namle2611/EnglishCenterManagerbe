using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Enrollments;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class EnrollmentService : IEnrollmentService
{
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly IEnrollmentRepository _enrollmentRepository;
    private readonly ILogger<EnrollmentService> _logger;

    public EnrollmentService(
        AppDbContext context,
        IEnrollmentRepository enrollmentRepository,
        ILogger<EnrollmentService> logger)
    {
        _context = context;
        _enrollmentRepository = enrollmentRepository;
        _logger = logger;
    }

    public async Task<PagedResult<EnrollmentListItemResponse>> GetListAsync(EnrollmentQuery query, CancellationToken cancellationToken = default)
    {
        return await _enrollmentRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<EnrollmentDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var detail = await _enrollmentRepository.GetDetailByIdAsync(id, cancellationToken);
        if (detail == null)
        {
            throw new NotFoundException($"Enrollment with ID {id} not found.");
        }

        return detail;
    }

    public async Task<EnrollmentDetailResponse> CreateAsync(CreateEnrollmentRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.StudentId.HasValue || request.StudentId.Value <= 0)
        {
            throw new ValidationException("StudentId must be greater than 0.");
        }

        if (!request.CourseId.HasValue || request.CourseId.Value <= 0)
        {
            throw new ValidationException("CourseId must be greater than 0.");
        }

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                // 1. Validate Target Student
                var student = await _enrollmentRepository.GetStudentByIdAsync(request.StudentId.Value, cancellationToken);
                if (student == null)
                {
                    throw new NotFoundException($"Student with ID {request.StudentId.Value} not found.");
                }

                if (student.Status != StudentStatus.Active)
                {
                    throw new ValidationException("Cannot enroll a student who is not active.");
                }

                // 2. Validate Target Course
                var course = await _enrollmentRepository.GetCourseByIdAsync(request.CourseId.Value, cancellationToken);
                if (course == null)
                {
                    throw new NotFoundException($"Course with ID {request.CourseId.Value} not found.");
                }

                if (course.Status != CourseStatus.Active)
                {
                    throw new ValidationException("Cannot enroll in an inactive course.");
                }

                // 3. Enforce Duplicate Enrollment Invariant
                var hasActive = await _enrollmentRepository.HasActiveEnrollmentAsync(request.StudentId.Value, request.CourseId.Value, null, cancellationToken);
                if (hasActive)
                {
                    throw new ConflictException("Student already has an active or pending enrollment for this course.");
                }

                // 4. Derive TuitionAmount and EnrollmentDate
                var tuitionAmount = request.TuitionAmount ?? course.TuitionFee;
                if (tuitionAmount < 0)
                {
                    throw new ValidationException("TuitionAmount must be greater than or equal to 0.");
                }

                var enrollmentDate = request.EnrollmentDate ?? DateTime.UtcNow;

                // 5. Construct and Save Entity (strictly Pending)
                var enrollment = new Enrollment
                {
                    StudentId = request.StudentId.Value,
                    CourseId = request.CourseId.Value,
                    TuitionAmount = tuitionAmount,
                    EnrollmentDate = enrollmentDate,
                    Status = EnrollmentStatus.Pending
                };

                await _enrollmentRepository.AddAsync(enrollment, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return await GetDetailAsync(enrollment.Id, cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on enrollment creation (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for enrollment creation due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    public async Task<EnrollmentDetailResponse> UpdateAsync(int id, UpdateEnrollmentRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.TuitionAmount.HasValue || request.TuitionAmount.Value < 0)
        {
            throw new ValidationException("TuitionAmount must be greater than or equal to 0.");
        }

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var enrollment = await _enrollmentRepository.GetByIdAsync(id, cancellationToken);
                if (enrollment == null)
                {
                    throw new NotFoundException($"Enrollment with ID {id} not found.");
                }

                // Immutability Window: only editable while Pending or Confirmed
                if (enrollment.Status != EnrollmentStatus.Pending && enrollment.Status != EnrollmentStatus.Confirmed)
                {
                    throw new ValidationException("TuitionAmount cannot be modified once the enrollment has been paid, enrolled, or cancelled.");
                }

                enrollment.TuitionAmount = request.TuitionAmount.Value;

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return await GetDetailAsync(enrollment.Id, cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on enrollment update (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for enrollment update due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    public async Task<EnrollmentDetailResponse> UpdateStatusAsync(int id, UpdateEnrollmentStatusRequest request, int currentUserId, CancellationToken cancellationToken = default)
    {
        if (request == null || !request.Status.HasValue)
        {
            throw new ValidationException("Status is required.");
        }

        var targetStatus = request.Status.Value;

        if (targetStatus == EnrollmentStatus.Pending)
        {
            throw new ValidationException("Cannot transition enrollment status back to Pending.");
        }

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var enrollment = await _enrollmentRepository.GetByIdAsync(id, cancellationToken);
                if (enrollment == null)
                {
                    throw new NotFoundException($"Enrollment with ID {id} not found.");
                }

                var currentStatus = enrollment.Status;

                if (currentStatus == EnrollmentStatus.Cancelled)
                {
                    throw new ValidationException("Cancelled enrollment is terminal and cannot transition to any other status.");
                }

                if (currentStatus == targetStatus)
                {
                    throw new ValidationException($"Enrollment is already in status {targetStatus}.");
                }

                // Strict linear lifecycle validation (no shortcuts allowed)
                var isValidTransition = (currentStatus, targetStatus) switch
                {
                    (EnrollmentStatus.Pending, EnrollmentStatus.Confirmed) => true,
                    (EnrollmentStatus.Pending, EnrollmentStatus.Cancelled) => true,
                    (EnrollmentStatus.Confirmed, EnrollmentStatus.Paid) => true,
                    (EnrollmentStatus.Confirmed, EnrollmentStatus.Cancelled) => true,
                    (EnrollmentStatus.Paid, EnrollmentStatus.Enrolled) => true,
                    (EnrollmentStatus.Paid, EnrollmentStatus.Cancelled) => true,
                    (EnrollmentStatus.Enrolled, EnrollmentStatus.Cancelled) => true,
                    _ => false
                };

                if (!isValidTransition)
                {
                    throw new ValidationException($"Invalid status transition from {currentStatus} to {targetStatus}.");
                }

                // Forward transition revalidation: Student & Course must be Active
                if (targetStatus != EnrollmentStatus.Cancelled)
                {
                    var student = await _enrollmentRepository.GetStudentByIdAsync(enrollment.StudentId, cancellationToken);
                    if (student == null || student.Status != StudentStatus.Active)
                    {
                        throw new ValidationException("Cannot advance enrollment because the student is not active.");
                    }

                    var course = await _enrollmentRepository.GetCourseByIdAsync(enrollment.CourseId, cancellationToken);
                    if (course == null || course.Status != CourseStatus.Active)
                    {
                        throw new ValidationException("Cannot advance enrollment because the course is not active.");
                    }
                }

                // Apply specific transitions
                switch (targetStatus)
                {
                    case EnrollmentStatus.Confirmed:
                        enrollment.ConfirmedBy = currentUserId;
                        enrollment.ConfirmedAt = DateTime.UtcNow;
                        enrollment.Status = EnrollmentStatus.Confirmed;
                        break;

                    case EnrollmentStatus.Paid:
                        enrollment.Status = EnrollmentStatus.Paid;
                        break;

                    case EnrollmentStatus.Enrolled:
                        if (!request.ClassId.HasValue || request.ClassId.Value <= 0)
                        {
                            throw new ValidationException("ClassId is required when transitioning to Enrolled status.");
                        }

                        var targetClass = await _enrollmentRepository.GetClassByIdAsync(request.ClassId.Value, cancellationToken);
                        if (targetClass == null)
                        {
                            throw new NotFoundException($"Class with ID {request.ClassId.Value} not found.");
                        }

                        if (targetClass.CourseId != enrollment.CourseId)
                        {
                            throw new ValidationException($"Class {targetClass.ClassCode} does not belong to course ID {enrollment.CourseId}.");
                        }

                        if (targetClass.Status != ClassStatus.Planned && targetClass.Status != ClassStatus.Ongoing)
                        {
                            throw new ValidationException("Cannot place student into a completed or cancelled class.");
                        }

                        // Same-Class Re-placement Protection: if any row exists in ClassStudents for (ClassId, StudentId), reject
                        var classStudentExists = await _enrollmentRepository.HasClassStudentAsync(targetClass.Id, enrollment.StudentId, cancellationToken);
                        if (classStudentExists)
                        {
                            throw new ConflictException($"Student has a prior record in class ID {targetClass.Id}. Re-placement into the same class is not permitted. Please assign a different class.");
                        }

                        // Class Capacity Invariant
                        var activeCount = await _enrollmentRepository.GetActiveClassStudentCountAsync(targetClass.Id, cancellationToken);
                        if (activeCount >= targetClass.MaxStudents)
                        {
                            throw new ConflictException($"Class {targetClass.ClassCode} has reached its maximum capacity of {targetClass.MaxStudents} students.");
                        }

                        // Create ClassStudent record atomically
                        var newClassStudent = new ClassStudent
                        {
                            ClassId = targetClass.Id,
                            StudentId = enrollment.StudentId,
                            EnrollmentId = enrollment.Id,
                            JoinedAt = DateTime.UtcNow,
                            Status = ClassStudentStatus.Active
                        };

                        await _enrollmentRepository.AddClassStudentAsync(newClassStudent, cancellationToken);
                        enrollment.Status = EnrollmentStatus.Enrolled;
                        break;

                    case EnrollmentStatus.Cancelled:
                        // Protect academic history: if ClassStudent is Completed, reject cancellation
                        if (enrollment.ClassStudent != null)
                        {
                            if (enrollment.ClassStudent.Status == ClassStudentStatus.Completed)
                            {
                                throw new ValidationException("Cannot cancel an enrollment for a class that has already been marked as completed.");
                            }

                            if (enrollment.ClassStudent.Status == ClassStudentStatus.Active)
                            {
                                enrollment.ClassStudent.Status = ClassStudentStatus.Withdrawn;
                            }
                        }

                        enrollment.Status = EnrollmentStatus.Cancelled;
                        break;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return await GetDetailAsync(enrollment.Id, cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on status transition (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for status transition due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var enrollment = await _enrollmentRepository.GetByIdAsync(id, cancellationToken);
                if (enrollment == null)
                {
                    throw new NotFoundException($"Enrollment with ID {id} not found.");
                }

                // Strictly guarded delete: Only Pending, 0 payments, and null ClassStudent
                if (enrollment.Status != EnrollmentStatus.Pending)
                {
                    throw new ValidationException("Only pending enrollments without payments or class assignments can be deleted. Use cancellation for confirmed or active enrollments.");
                }

                if (enrollment.ClassStudent != null)
                {
                    throw new ValidationException("Only pending enrollments without payments or class assignments can be deleted. Use cancellation for confirmed or active enrollments.");
                }

                var hasPayments = await _enrollmentRepository.HasPaymentsAsync(id, cancellationToken);
                if (hasPayments)
                {
                    throw new ValidationException("Only pending enrollments without payments or class assignments can be deleted. Use cancellation for confirmed or active enrollments.");
                }

                await _enrollmentRepository.DeleteAsync(enrollment, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return;
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on enrollment deletion (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for enrollment deletion due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    private static bool IsTransientException(Exception ex)
    {
        if (ex is SqlException sqlEx && (sqlEx.Number == 1205 || sqlEx.Number == 1222))
        {
            return true;
        }

        var current = ex.InnerException;
        while (current != null)
        {
            if (current is SqlException innerSqlEx && (innerSqlEx.Number == 1205 || innerSqlEx.Number == 1222))
            {
                return true;
            }
            current = current.InnerException;
        }

        return false;
    }
}
