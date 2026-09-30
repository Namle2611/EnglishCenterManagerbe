using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Assignments;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class AssignmentService : IAssignmentService
{
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ILogger<AssignmentService> _logger;

    public AssignmentService(
        AppDbContext context,
        IAssignmentRepository assignmentRepository,
        ILogger<AssignmentService> logger)
    {
        _context = context;
        _assignmentRepository = assignmentRepository;
        _logger = logger;
    }

    public async Task<PagedResult<AssignmentListItemResponse>> GetListAsync(
        AssignmentQuery query,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        int? teacherUserScope = null;
        int? studentUserScope = null;

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            teacherUserScope = actor.UserId;

            if (query.ClassId.HasValue)
            {
                var targetClass = await _assignmentRepository.GetClassAsync(query.ClassId.Value, cancellationToken);
                if (targetClass != null && targetClass.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot access assignments for another teacher's class.");
                }
            }

            if (query.TeacherId.HasValue)
            {
                var teacher = await _context.Teachers.FirstOrDefaultAsync(t => t.UserId == actor.UserId, cancellationToken);
                if (teacher != null && query.TeacherId.Value != teacher.Id)
                {
                    throw new ForbiddenException("You cannot filter assignments by another teacher.");
                }
            }
        }
        else if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            studentUserScope = actor.UserId;

            if (query.ClassId.HasValue)
            {
                var isEnrolled = await _context.ClassStudents.AnyAsync(
                    cs => cs.ClassId == query.ClassId.Value &&
                          cs.Student.UserId == actor.UserId &&
                          (cs.Status == ClassStudentStatus.Active || cs.Status == ClassStudentStatus.Completed),
                    cancellationToken);

                if (!isEnrolled)
                {
                    throw new ForbiddenException("You cannot access assignments for this class.");
                }
            }
        }

        return await _assignmentRepository.GetPagedAsync(query, teacherUserScope, studentUserScope, cancellationToken);
    }

    public async Task<AssignmentDetailResponse> GetDetailAsync(
        int id,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        int? studentScope = actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher ? actor.UserId : null;
        var assignment = await _assignmentRepository.GetDetailByIdAsync(id, studentScope, cancellationToken);

        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with ID {id} not found.");
        }

        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            // Draft concealment for students
            if (assignment.Status == AssignmentStatus.Draft)
            {
                throw new NotFoundException($"Assignment with ID {id} not found.");
            }

            var isEnrolled = await _context.ClassStudents.AnyAsync(
                cs => cs.ClassId == assignment.ClassId &&
                      cs.Student.UserId == actor.UserId &&
                      (cs.Status == ClassStudentStatus.Active || cs.Status == ClassStudentStatus.Completed),
                cancellationToken);

            if (!isEnrolled)
            {
                throw new ForbiddenException("You cannot access assignments for this class.");
            }
        }
        else if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            var targetClass = await _assignmentRepository.GetClassAsync(assignment.ClassId, cancellationToken);
            if (targetClass != null && targetClass.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot access assignments for another teacher's class.");
            }
        }

        return assignment;
    }

    public async Task<AssignmentDetailResponse> CreateAsync(
        CreateAssignmentRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to create assignments.");
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var targetClass = await _assignmentRepository.GetClassAsync(request.ClassId!.Value, cancellationToken);
                if (targetClass == null)
                {
                    throw new NotFoundException($"Class with ID {request.ClassId.Value} not found.");
                }

                if (actor.IsTeacher && !actor.CanManageAll)
                {
                    await RequireActiveTeacherAsync(actor, cancellationToken);
                    if (targetClass.Teacher?.UserId != actor.UserId)
                    {
                        throw new ForbiddenException("You cannot create assignments for another teacher's class.");
                    }
                }

                if (targetClass.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot create assignments for a completed class.");
                }

                if (targetClass.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot create assignments for a cancelled class.");
                }

                if (!targetClass.TeacherId.HasValue)
                {
                    throw new ValidationException("Class must have an assigned teacher to create assignments.");
                }

                var normalizedTitle = request.Title.Trim();
                var hasDuplicate = await _assignmentRepository.HasDuplicateTitleAsync(
                    targetClass.Id,
                    normalizedTitle.ToLowerInvariant(),
                    cancellationToken: cancellationToken);

                if (hasDuplicate)
                {
                    throw new ConflictException("An assignment with this title already exists in the class.");
                }

                var assignment = new Assignment
                {
                    ClassId = targetClass.Id,
                    TeacherId = targetClass.TeacherId.Value, // Assigned Teacher Snapshot at Assignment Creation
                    Title = normalizedTitle,
                    Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
                    AttachmentUrl = string.IsNullOrWhiteSpace(request.AttachmentUrl) ? null : request.AttachmentUrl.Trim(),
                    Deadline = request.Deadline!.Value,
                    MaxScore = request.MaxScore!.Value,
                    Status = request.Status!.Value
                };

                await _assignmentRepository.AddAsync(assignment, cancellationToken);
                await _assignmentRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _assignmentRepository.GetDetailByIdAsync(assignment.Id, cancellationToken: cancellationToken))!;
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("An assignment with this title already exists in the class.");
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Assignment create contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Assignment could not be created due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Assignment could not be created due to concurrent conflicts. Please retry.");
    }

    public async Task<AssignmentDetailResponse> UpdateAsync(
        int id,
        UpdateAssignmentRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to update assignments.");
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var assignment = await _assignmentRepository.GetByIdForUpdateAsync(id, cancellationToken);
                if (assignment == null)
                {
                    throw new NotFoundException($"Assignment with ID {id} not found.");
                }

                if (actor.IsTeacher && !actor.CanManageAll)
                {
                    await RequireActiveTeacherAsync(actor, cancellationToken);
                    if (assignment.Class.Teacher?.UserId != actor.UserId)
                    {
                        throw new ForbiddenException("You cannot update assignments for another teacher's class.");
                    }
                }

                if (assignment.Class.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot modify assignments for a completed class.");
                }

                if (assignment.Class.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot modify assignments for a cancelled class.");
                }

                var normalizedTitle = request.Title.Trim();
                var normalizedDesc = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
                var normalizedUrl = string.IsNullOrWhiteSpace(request.AttachmentUrl) ? null : request.AttachmentUrl.Trim();

                // Same-value semantics: if ALL mutable values are identical, return 200 without redundant SaveChanges
                if (assignment.Title == normalizedTitle &&
                    assignment.Description == normalizedDesc &&
                    assignment.AttachmentUrl == normalizedUrl &&
                    assignment.Deadline == request.Deadline!.Value &&
                    assignment.MaxScore == request.MaxScore!.Value &&
                    assignment.Status == request.Status!.Value)
                {
                    await transaction.CommitAsync(cancellationToken);
                    return (await _assignmentRepository.GetDetailByIdAsync(id, cancellationToken: cancellationToken))!;
                }

                // Check title uniqueness if title changed
                if (!string.Equals(assignment.Title, normalizedTitle, StringComparison.OrdinalIgnoreCase))
                {
                    var hasDuplicate = await _assignmentRepository.HasDuplicateTitleAsync(
                        assignment.ClassId,
                        normalizedTitle.ToLowerInvariant(),
                        id,
                        cancellationToken);

                    if (hasDuplicate)
                    {
                        throw new ConflictException("An assignment with this title already exists in the class.");
                    }
                }

                // Status transition validation
                if (assignment.Status != request.Status!.Value)
                {
                    if (assignment.Status == AssignmentStatus.Closed && request.Status.Value == AssignmentStatus.Draft)
                    {
                        throw new ValidationException("Cannot transition assignment from Closed to Draft.");
                    }

                    if (assignment.Status == AssignmentStatus.Published && request.Status.Value == AssignmentStatus.Draft)
                    {
                        var hasSubmissions = await _assignmentRepository.HasSubmissionsAsync(id, cancellationToken);
                        if (hasSubmissions)
                        {
                            throw new ValidationException("Cannot revert assignment to Draft because student submissions already exist.");
                        }
                    }
                }

                // Apply mutation (ClassId and TeacherId remain strictly immutable)
                assignment.Title = normalizedTitle;
                assignment.Description = normalizedDesc;
                assignment.AttachmentUrl = normalizedUrl;
                assignment.Deadline = request.Deadline!.Value;
                assignment.MaxScore = request.MaxScore!.Value;
                assignment.Status = request.Status!.Value;

                await _assignmentRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _assignmentRepository.GetDetailByIdAsync(id, cancellationToken: cancellationToken))!;
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("An assignment with this title already exists in the class.");
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Assignment update contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Assignment could not be updated due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Assignment could not be updated due to concurrent conflicts. Please retry.");
    }

    public async Task DeleteAsync(
        int id,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll)
        {
            throw new ForbiddenException("Students are not permitted to delete assignments.");
        }

        var assignment = await _assignmentRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with ID {id} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            await RequireActiveTeacherAsync(actor, cancellationToken);
            if (assignment.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot delete assignments for another teacher's class.");
            }
        }

        if (assignment.Class.Status == ClassStatus.Completed)
        {
            throw new ValidationException("Cannot delete assignments for a completed class.");
        }

        if (assignment.Class.Status == ClassStatus.Cancelled)
        {
            throw new ValidationException("Cannot delete assignments for a cancelled class.");
        }

        var hasSubmissions = await _assignmentRepository.HasSubmissionsAsync(id, cancellationToken);
        if (hasSubmissions)
        {
            throw new ConflictException("Cannot delete assignment because student submissions exist.");
        }

        try
        {
            _assignmentRepository.Remove(assignment);
            await _assignmentRepository.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException)
        {
            _context.ChangeTracker.Clear();
            throw new ConflictException("Cannot delete assignment because student submissions exist.");
        }
    }

    public async Task<PagedResult<TeacherAssignmentClassLookupItemResponse>> GetTeacherAssignmentClassLookupAsync(
        TeacherAssignmentClassLookupQuery query,
        AssignmentActor actor,
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
                var targetClass = await _assignmentRepository.GetClassAsync(query.ClassId.Value, cancellationToken);
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

        return await _assignmentRepository.GetTeacherAssignmentClassLookupAsync(query, teacherUserId, cancellationToken);
    }

    private async Task<Teacher> RequireActiveTeacherAsync(AssignmentActor actor, CancellationToken cancellationToken)
    {
        var teacher = await _context.Teachers
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == actor.UserId, cancellationToken);

        if (teacher == null)
        {
            throw new ForbiddenException("Teacher profile not found.");
        }

        if (teacher.Status != TeacherStatus.Active || !teacher.User.IsActive)
        {
            throw new ForbiddenException("Teacher account is inactive.");
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

            if (exception is SqlException sqlException &&
                (sqlException.Number == 1205 || sqlException.Number == 1222))
            {
                return true;
            }

            exception = exception.InnerException;
        }

        return false;
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException exception)
    {
        Exception? current = exception;
        while (current != null)
        {
            if (current is SqlException sqlException &&
                (sqlException.Number == 2601 || sqlException.Number == 2627))
            {
                return true;
            }
            current = current.InnerException;
        }

        return false;
    }
}
