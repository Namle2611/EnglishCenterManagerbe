using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Submissions;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class SubmissionService : ISubmissionService
{
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly ISubmissionRepository _submissionRepository;
    private readonly IAssignmentRepository _assignmentRepository;
    private readonly ILogger<SubmissionService> _logger;

    public SubmissionService(
        AppDbContext context,
        ISubmissionRepository submissionRepository,
        IAssignmentRepository assignmentRepository,
        ILogger<SubmissionService> logger)
    {
        _context = context;
        _submissionRepository = submissionRepository;
        _assignmentRepository = assignmentRepository;
        _logger = logger;
    }

    public async Task<PagedResult<SubmissionListItemResponse>> GetSubmissionsForAssignmentAsync(
        int assignmentId,
        SubmissionQuery query,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students cannot view the submission list for an assignment.");
        }

        var assignment = await _assignmentRepository.GetByIdForUpdateAsync(assignmentId, cancellationToken);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with ID {assignmentId} not found.");
        }

        if (actor.IsTeacher && !actor.CanManageAll)
        {
            if (assignment.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot view submissions for another teacher's class.");
            }
        }

        return await _submissionRepository.GetPagedAsync(assignmentId, query, cancellationToken);
    }

    public async Task<SubmissionDetailResponse> GetDetailAsync(
        int id,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        var submission = await _submissionRepository.GetByIdForUpdateAsync(id, cancellationToken);
        if (submission == null)
        {
            throw new NotFoundException($"Submission with ID {id} not found.");
        }

        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            // Student may only view their OWN submission
            if (submission.Student.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot access another student's submission.");
            }
        }
        else if (actor.IsTeacher && !actor.CanManageAll)
        {
            if (submission.Assignment.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot view submissions for another teacher's class.");
            }
        }

        return (await _submissionRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<SubmissionDetailResponse> GetMySubmissionAsync(
        int assignmentId,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students can access their personal assignment submissions.");
        }

        var assignment = await _assignmentRepository.GetByIdForUpdateAsync(assignmentId, cancellationToken);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with ID {assignmentId} not found.");
        }

        if (assignment.Status == AssignmentStatus.Draft)
        {
            throw new NotFoundException($"Assignment with ID {assignmentId} not found.");
        }

        var student = await _submissionRepository.GetStudentByUserIdAsync(actor.UserId, cancellationToken);
        if (student == null)
        {
            throw new ForbiddenException("Student profile not found.");
        }

        var classStudent = await _submissionRepository.GetClassStudentAsync(assignment.ClassId, student.Id, cancellationToken);
        if (classStudent == null)
        {
            throw new ForbiddenException("You are not enrolled in this class.");
        }

        var submission = await _submissionRepository.GetByAssignmentAndStudentAsync(assignmentId, student.Id, cancellationToken);
        if (submission == null)
        {
            throw new NotFoundException("You have not submitted work for this assignment yet.");
        }

        return (await _submissionRepository.GetDetailByIdAsync(submission.Id, cancellationToken))!;
    }

    public async Task<SubmissionDetailResponse> CreateAsync(
        int assignmentId,
        CreateSubmissionRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students are permitted to submit assignments.");
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var student = await _submissionRepository.GetStudentByUserIdAsync(actor.UserId, cancellationToken);
                if (student == null)
                {
                    throw new ForbiddenException("Student profile not found.");
                }

                var assignment = await _assignmentRepository.GetByIdForUpdateAsync(assignmentId, cancellationToken);
                if (assignment == null)
                {
                    throw new NotFoundException($"Assignment with ID {assignmentId} not found.");
                }

                // Draft concealment for students
                if (assignment.Status == AssignmentStatus.Draft)
                {
                    throw new NotFoundException($"Assignment with ID {assignmentId} not found.");
                }

                var classStudent = await _submissionRepository.GetClassStudentAsync(assignment.ClassId, student.Id, cancellationToken);
                if (classStudent == null)
                {
                    throw new ForbiddenException("You are not enrolled in this class.");
                }

                if (classStudent.Status != ClassStudentStatus.Active)
                {
                    throw new ForbiddenException("Only active students may submit assignments.");
                }

                if (assignment.Class.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot submit assignments for a completed class.");
                }

                if (assignment.Class.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot submit assignments for a cancelled class.");
                }

                if (assignment.Status == AssignmentStatus.Closed)
                {
                    throw new ValidationException("Assignment is closed for submissions.");
                }

                var existing = await _submissionRepository.GetByAssignmentAndStudentAsync(assignmentId, student.Id, cancellationToken);
                if (existing != null)
                {
                    throw new ConflictException("You have already submitted this assignment. Use the update endpoint to resubmit.");
                }

                var fileUrl = string.IsNullOrWhiteSpace(request.FileUrl) ? null : request.FileUrl.Trim();
                var content = string.IsNullOrWhiteSpace(request.Content) ? null : request.Content.Trim();

                if (string.IsNullOrWhiteSpace(fileUrl) && string.IsNullOrWhiteSpace(content))
                {
                    throw new ValidationException("At least one of FileUrl or Content must be provided.");
                }

                var submission = new Submission
                {
                    AssignmentId = assignmentId,
                    StudentId = student.Id,
                    FileUrl = fileUrl,
                    Content = content,
                    SubmittedAt = DateTime.UtcNow,
                    Score = null,
                    Feedback = null
                };

                await _submissionRepository.AddAsync(submission, cancellationToken);
                await _submissionRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _submissionRepository.GetDetailByIdAsync(submission.Id, cancellationToken))!;
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("You have already submitted this assignment. Use the update endpoint to resubmit.");
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Submission create contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Submission could not be created due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Submission could not be created due to concurrent conflicts. Please retry.");
    }

    public async Task<SubmissionDetailResponse> UpdateAsync(
        int id,
        UpdateSubmissionRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (!actor.IsStudent)
        {
            throw new ForbiddenException("Only students are permitted to update submissions.");
        }

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                var submission = await _submissionRepository.GetByIdForUpdateAsync(id, cancellationToken);
                if (submission == null)
                {
                    throw new NotFoundException($"Submission with ID {id} not found.");
                }

                if (submission.Student.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot modify another student's submission.");
                }

                var classStudent = await _submissionRepository.GetClassStudentAsync(
                    submission.Assignment.ClassId,
                    submission.StudentId,
                    cancellationToken);

                if (classStudent == null || classStudent.Status != ClassStudentStatus.Active)
                {
                    throw new ForbiddenException("Only active students may resubmit assignments.");
                }

                if (submission.Assignment.Class.Status == ClassStatus.Completed)
                {
                    throw new ValidationException("Cannot modify submissions for a completed class.");
                }

                if (submission.Assignment.Class.Status == ClassStatus.Cancelled)
                {
                    throw new ValidationException("Cannot modify submissions for a cancelled class.");
                }

                if (submission.Assignment.Status == AssignmentStatus.Closed)
                {
                    throw new ValidationException("Assignment is closed for submissions.");
                }

                if (submission.Score != null)
                {
                    throw new ValidationException("Cannot resubmit an assignment that has already been graded.");
                }

                var fileUrl = string.IsNullOrWhiteSpace(request.FileUrl) ? null : request.FileUrl.Trim();
                var content = string.IsNullOrWhiteSpace(request.Content) ? null : request.Content.Trim();

                if (string.IsNullOrWhiteSpace(fileUrl) && string.IsNullOrWhiteSpace(content))
                {
                    throw new ValidationException("At least one of FileUrl or Content must be provided.");
                }

                submission.FileUrl = fileUrl;
                submission.Content = content;
                submission.SubmittedAt = DateTime.UtcNow;

                await _submissionRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _submissionRepository.GetDetailByIdAsync(id, cancellationToken))!;
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("A submission conflict occurred. Please retry.");
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Submission update contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Submission could not be updated due to concurrent conflicts. Please retry.");
            }
        }

        throw new ConflictException("Submission could not be updated due to concurrent conflicts. Please retry.");
    }

    public async Task<SubmissionDetailResponse> GradeAsync(
        int assignmentId,
        int submissionId,
        GradeSubmissionRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default)
    {
        if (actor.IsStudent && !actor.CanManageAll && !actor.IsTeacher)
        {
            throw new ForbiddenException("Students cannot grade submissions.");
        }

        // STEP A: Load Assignment by assignmentId
        var assignment = await _assignmentRepository.GetByIdForUpdateAsync(assignmentId, cancellationToken);
        if (assignment == null)
        {
            throw new NotFoundException($"Assignment with ID {assignmentId} not found.");
        }

        // STEP B: Authorize actor against Assignment (dynamic current Class Teacher)
        if (actor.IsTeacher && !actor.CanManageAll)
        {
            if (assignment.Class.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot grade submissions for another teacher's class.");
            }
        }

        // Lifecycle rules (Section 18)
        if (assignment.Status == AssignmentStatus.Draft)
        {
            throw new ValidationException("Cannot grade submissions for a draft assignment.");
        }
        if (assignment.Class.Status == ClassStatus.Planned)
        {
            throw new ValidationException("Cannot grade submissions for a planned class.");
        }
        if (assignment.Class.Status == ClassStatus.Cancelled)
        {
            throw new ValidationException("Cannot grade submissions for a cancelled class.");
        }

        // STEP C: Scoped submission lookup (Section 10 & 13: 404 for nonexistent or foreign assignment)
        var submission = await _submissionRepository.GetByIdAndAssignmentForUpdateAsync(submissionId, assignmentId, cancellationToken);
        if (submission == null)
        {
            throw new NotFoundException($"Submission with ID {submissionId} not found.");
        }

        // Validate Score (Section 14)
        if (!request.Score.HasValue)
        {
            throw new ValidationException("Score is required.");
        }
        if (request.Score.Value < 0 || request.Score.Value > assignment.MaxScore)
        {
            throw new ValidationException($"Score must be between 0 and {assignment.MaxScore}.");
        }

        // Write authoritative grade (Section 15 & 16)
        submission.Score = request.Score.Value;
        submission.Feedback = string.IsNullOrWhiteSpace(request.Feedback) ? null : request.Feedback.Trim();

        await _submissionRepository.SaveChangesAsync(cancellationToken);

        return (await _submissionRepository.GetDetailByIdAsync(submission.Id, cancellationToken))!;
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
