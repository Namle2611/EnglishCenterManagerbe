using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Attendances;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class AttendanceService : IAttendanceService
{
    private const int MaxConcurrencyRetries = 2;
    private static readonly TimeSpan MaximumTimeOfDay = TimeSpan.FromDays(1);

    private readonly AppDbContext _context;
    private readonly IAttendanceRepository _attendanceRepository;
    private readonly ILogger<AttendanceService> _logger;

    public AttendanceService(
        AppDbContext context,
        IAttendanceRepository attendanceRepository,
        ILogger<AttendanceService> logger)
    {
        _context = context;
        _attendanceRepository = attendanceRepository;
        _logger = logger;
    }

    public async Task<PagedResult<AttendanceListItemResponse>> GetListAsync(
        AttendanceQuery query,
        AttendanceActor actor,
        CancellationToken cancellationToken = default)
    {
        int? teacherUserScope = null;
        if (!actor.CanManageAll)
        {
            var teacher = await RequireActiveTeacherAsync(actor, cancellationToken);
            teacherUserScope = actor.UserId;

            if (query.TeacherId.HasValue && query.TeacherId.Value != teacher.Id)
            {
                throw new ForbiddenException("You cannot access attendance for another teacher.");
            }

            if (query.ClassId.HasValue)
            {
                var targetClass = await _attendanceRepository.GetClassAsync(query.ClassId.Value, cancellationToken);
                if (targetClass != null && targetClass.Teacher?.UserId != actor.UserId)
                {
                    throw new ForbiddenException("You cannot access attendance for another teacher's class.");
                }
            }
        }

        return await _attendanceRepository.GetPagedAsync(query, teacherUserScope, cancellationToken);
    }

    public async Task<AttendanceDetailResponse> GetDetailAsync(
        int id,
        AttendanceActor actor,
        CancellationToken cancellationToken = default)
    {
        var record = await _attendanceRepository.GetRecordForUpdateAsync(id, cancellationToken);
        if (record == null)
        {
            throw new NotFoundException($"Attendance record with ID {id} not found.");
        }

        AuthorizeClass(record.AttendanceSession.Class, actor);
        return (await _attendanceRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<AttendanceSessionRosterResponse> GetSessionRosterAsync(
        AttendanceSessionQuery query,
        AttendanceActor actor,
        CancellationToken cancellationToken = default)
    {
        ValidateSessionIdentity(query.ClassId, query.SessionDate, query.StartTime);

        var classId = query.ClassId!.Value;
        var sessionDate = query.SessionDate!.Value;
        var startTime = query.StartTime!.Value;
        var databaseDate = sessionDate.ToDateTime(TimeOnly.MinValue);

        var targetClass = await GetRequiredClassAsync(classId, cancellationToken);
        AuthorizeClass(targetClass, actor);

        var sessions = await _attendanceRepository.GetNaturalSessionsAsync(
            classId,
            databaseDate,
            startTime,
            lockForUpdate: false,
            cancellationToken);

        EnsureSessionIsUnambiguous(sessions);
        var session = sessions.SingleOrDefault();

        if (session == null)
        {
            await ValidateMissingSessionAsync(targetClass, sessionDate, startTime, cancellationToken);
        }

        return await BuildRosterAsync(targetClass, session, sessionDate, startTime, actor, cancellationToken);
    }

    public async Task<AttendanceDetailResponse> CreateAsync(
        CreateAttendanceRequest request,
        AttendanceActor actor,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        ValidateSessionIdentity(request.ClassId, request.SessionDate, request.StartTime);
        if (!request.StudentId.HasValue || request.StudentId.Value <= 0)
        {
            throw new ValidationException("StudentId must be greater than 0.");
        }
        if (!request.Status.HasValue || !Enum.IsDefined(request.Status.Value))
        {
            throw new ValidationException("Invalid attendance status.");
        }

        var classId = request.ClassId!.Value;
        var sessionDate = request.SessionDate!.Value;
        var startTime = request.StartTime!.Value;
        var studentId = request.StudentId.Value;
        var databaseDate = sessionDate.ToDateTime(TimeOnly.MinValue);
        var note = NormalizeNote(request.Note);

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);
            int createdRecordId;

            try
            {
                await SetAttendanceLockTimeoutAsync(cancellationToken);
                var targetClass = await GetRequiredClassAsync(classId, cancellationToken);
                AuthorizeClass(targetClass, actor);

                var sessions = await _attendanceRepository.GetNaturalSessionsAsync(
                    classId,
                    databaseDate,
                    startTime,
                    lockForUpdate: true,
                    cancellationToken);
                EnsureSessionIsUnambiguous(sessions);
                var session = sessions.SingleOrDefault();
                var createdSession = session == null;

                if (createdSession)
                {
                    await ValidateMissingSessionAsync(targetClass, sessionDate, startTime, cancellationToken);
                    EnsureCanCreateSession(targetClass, actor);
                }

                await ValidateNewRecordAsync(targetClass, sessionDate, studentId, cancellationToken);

                if (session != null && await _attendanceRepository.GetRecordBySessionAndStudentAsync(
                        session.Id,
                        studentId,
                        tracked: false,
                        cancellationToken) != null)
                {
                    throw new ConflictException("Attendance already exists for this student and session.");
                }

                if (createdSession)
                {
                    session = new AttendanceSession
                    {
                        ClassId = classId,
                        SessionDate = databaseDate,
                        StartTime = startTime,
                        CreatedBy = targetClass.TeacherId!.Value
                    };
                    await _attendanceRepository.AddSessionAsync(session, cancellationToken);
                }

                var record = new AttendanceRecord
                {
                    AttendanceSessionId = createdSession ? 0 : session!.Id,
                    StudentId = studentId,
                    Status = request.Status.Value,
                    Note = note
                };
                if (createdSession)
                {
                    record.AttendanceSession = session!;
                }
                await _attendanceRepository.AddRecordAsync(record, cancellationToken);
                await _attendanceRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                createdRecordId = record.Id;
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Attendance already exists for this student and session.");
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Attendance create contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
                continue;
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Attendance could not be saved due to concurrent access. Please retry.");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw;
            }

            return (await _attendanceRepository.GetDetailByIdAsync(createdRecordId, cancellationToken))!;
        }

        throw new ConflictException("Attendance could not be saved due to concurrent access. Please retry.");
    }

    public async Task<AttendanceDetailResponse> UpdateAsync(
        int id,
        UpdateAttendanceRequest request,
        AttendanceActor actor,
        CancellationToken cancellationToken = default)
    {
        if (request == null || !request.Status.HasValue || !Enum.IsDefined(request.Status.Value))
        {
            throw new ValidationException("A valid attendance status is required.");
        }

        var record = await _attendanceRepository.GetRecordForUpdateAsync(id, cancellationToken);
        if (record == null)
        {
            throw new NotFoundException($"Attendance record with ID {id} not found.");
        }

        AuthorizeClass(record.AttendanceSession.Class, actor);
        record.Status = request.Status.Value;
        record.Note = NormalizeNote(request.Note);
        await _attendanceRepository.SaveChangesAsync(cancellationToken);

        return (await _attendanceRepository.GetDetailByIdAsync(id, cancellationToken))!;
    }

    public async Task<AttendanceSessionRosterResponse> BulkUpsertAsync(
        BulkUpsertAttendanceRequest request,
        AttendanceActor actor,
        CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        ValidateSessionIdentity(request.ClassId, request.SessionDate, request.StartTime);
        if (request.Records == null || request.Records.Count == 0)
        {
            throw new ValidationException("Records must contain at least one item.");
        }

        if (request.Records.Any(item => item == null))
        {
            throw new ValidationException("Attendance items cannot be null.");
        }

        var duplicateStudentId = request.Records
            .Where(item => item.StudentId.HasValue)
            .GroupBy(item => item.StudentId!.Value)
            .FirstOrDefault(group => group.Count() > 1);
        if (duplicateStudentId != null)
        {
            throw new ValidationException($"StudentId {duplicateStudentId.Key} appears more than once in the request.");
        }

        foreach (var item in request.Records)
        {
            if (!item.StudentId.HasValue || item.StudentId.Value <= 0)
            {
                throw new ValidationException("Every StudentId must be greater than 0.");
            }
            if (!item.Status.HasValue || !Enum.IsDefined(item.Status.Value))
            {
                throw new ValidationException($"A valid status is required for StudentId {item.StudentId.Value}.");
            }
        }

        var classId = request.ClassId!.Value;
        var sessionDate = request.SessionDate!.Value;
        var startTime = request.StartTime!.Value;
        var databaseDate = sessionDate.ToDateTime(TimeOnly.MinValue);

        for (var attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable,
                cancellationToken);

            try
            {
                await SetAttendanceLockTimeoutAsync(cancellationToken);
                var targetClass = await GetRequiredClassAsync(classId, cancellationToken);
                AuthorizeClass(targetClass, actor);

                var sessions = await _attendanceRepository.GetNaturalSessionsAsync(
                    classId,
                    databaseDate,
                    startTime,
                    lockForUpdate: true,
                    cancellationToken);
                EnsureSessionIsUnambiguous(sessions);
                var session = sessions.SingleOrDefault();
                var createdSession = session == null;

                if (createdSession)
                {
                    await ValidateMissingSessionAsync(targetClass, sessionDate, startTime, cancellationToken);
                    EnsureCanCreateSession(targetClass, actor);
                }

                var existingRecords = createdSession
                    ? new List<AttendanceRecord>()
                    : await _attendanceRepository.GetRecordsBySessionAsync(session!.Id, tracked: true, cancellationToken);
                var recordsByStudent = existingRecords.ToDictionary(record => record.StudentId);

                foreach (var item in request.Records)
                {
                    var studentId = item.StudentId!.Value;
                    var student = await _attendanceRepository.GetStudentAsync(studentId, cancellationToken);
                    if (student == null)
                    {
                        throw new NotFoundException($"Student with ID {studentId} not found.");
                    }

                    var membership = await _attendanceRepository.GetClassStudentAsync(classId, studentId, cancellationToken);
                    if (membership == null)
                    {
                        throw new ValidationException($"Student with ID {studentId} is not a member of class ID {classId}.");
                    }

                    if (!recordsByStudent.ContainsKey(studentId))
                    {
                        ValidateClassAllowsNewRecord(targetClass, sessionDate);
                        ValidateMembershipAllowsNewRecord(membership, sessionDate);
                    }
                }

                if (createdSession)
                {
                    session = new AttendanceSession
                    {
                        ClassId = classId,
                        SessionDate = databaseDate,
                        StartTime = startTime,
                        CreatedBy = targetClass.TeacherId!.Value
                    };
                    await _attendanceRepository.AddSessionAsync(session, cancellationToken);
                }

                var newRecords = new List<AttendanceRecord>();
                foreach (var item in request.Records)
                {
                    var studentId = item.StudentId!.Value;
                    if (recordsByStudent.TryGetValue(studentId, out var existingRecord))
                    {
                        existingRecord.Status = item.Status!.Value;
                        existingRecord.Note = NormalizeNote(item.Note);
                    }
                    else
                    {
                        var newRecord = new AttendanceRecord
                        {
                            AttendanceSessionId = createdSession ? 0 : session!.Id,
                            StudentId = studentId,
                            Status = item.Status!.Value,
                            Note = NormalizeNote(item.Note)
                        };
                        if (createdSession)
                        {
                            newRecord.AttendanceSession = session!;
                        }
                        newRecords.Add(newRecord);
                    }
                }

                await _attendanceRepository.AddRecordsAsync(newRecords, cancellationToken);
                await _attendanceRepository.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }
            catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("A duplicate attendance record was detected.");
            }
            catch (Exception ex) when (IsTransientConflict(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning(ex, "Attendance bulk contention on attempt {Attempt}; retrying.", attempt + 1);
                await Task.Delay(50 * (attempt + 1), cancellationToken);
                continue;
            }
            catch (Exception ex) when (IsTransientConflict(ex))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Attendance could not be saved due to concurrent access. Please retry.");
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw;
            }

            return await GetSessionRosterAsync(new AttendanceSessionQuery
            {
                ClassId = classId,
                SessionDate = sessionDate,
                StartTime = startTime
            }, actor, cancellationToken);
        }

        throw new ConflictException("Attendance could not be saved due to concurrent access. Please retry.");
    }

    public async Task<PagedResult<TeacherClassLookupItemResponse>> GetTeacherClassesLookupAsync(
        TeacherClassLookupQuery query,
        AttendanceActor actor,
        CancellationToken cancellationToken = default)
    {
        await RequireActiveTeacherAsync(actor, cancellationToken);

        if (query.ClassId.HasValue)
        {
            var targetClass = await _attendanceRepository.GetClassAsync(query.ClassId.Value, cancellationToken);
            if (targetClass == null)
            {
                throw new NotFoundException($"Class with ID {query.ClassId.Value} not found.");
            }

            if (targetClass.Teacher?.UserId != actor.UserId)
            {
                throw new ForbiddenException("You cannot access another teacher's class.");
            }
        }

        return await _attendanceRepository.GetTeacherClassesLookupAsync(query, actor.UserId, cancellationToken);
    }

    private async Task<CourseClass> GetRequiredClassAsync(int classId, CancellationToken cancellationToken)
    {
        return await _attendanceRepository.GetClassAsync(classId, cancellationToken)
               ?? throw new NotFoundException($"Class with ID {classId} not found.");
    }

    private async Task<Teacher> RequireActiveTeacherAsync(AttendanceActor actor, CancellationToken cancellationToken)
    {
        if (!actor.IsTeacher)
        {
            throw new ForbiddenException("Attendance access is forbidden.");
        }

        var teacher = await _attendanceRepository.GetTeacherByUserIdAsync(actor.UserId, cancellationToken);
        if (teacher == null || teacher.Status != TeacherStatus.Active || !teacher.User.IsActive)
        {
            throw new ForbiddenException("An active Teacher profile is required.");
        }

        return teacher;
    }

    private static void AuthorizeClass(CourseClass targetClass, AttendanceActor actor)
    {
        if (actor.CanManageAll)
        {
            return;
        }

        if (!actor.IsTeacher ||
            targetClass.Teacher == null ||
            targetClass.Teacher.UserId != actor.UserId ||
            targetClass.Teacher.Status != TeacherStatus.Active ||
            !targetClass.Teacher.User.IsActive)
        {
            throw new ForbiddenException("You cannot manage attendance for another teacher's class.");
        }
    }

    private static void EnsureCanCreateSession(CourseClass targetClass, AttendanceActor actor)
    {
        if (targetClass.Teacher == null ||
            !targetClass.TeacherId.HasValue ||
            targetClass.Teacher.UserId != actor.UserId ||
            targetClass.Teacher.Status != TeacherStatus.Active ||
            !targetClass.Teacher.User.IsActive)
        {
            throw new ForbiddenException("Only the active Teacher currently assigned to the class can create an attendance session.");
        }
    }

    private async Task ValidateMissingSessionAsync(
        CourseClass targetClass,
        DateOnly sessionDate,
        TimeSpan startTime,
        CancellationToken cancellationToken)
    {
        ValidateClassAllowsNewRecord(targetClass, sessionDate);

        var classStart = DateOnly.FromDateTime(targetClass.StartDate);
        var classEnd = DateOnly.FromDateTime(targetClass.EndDate);
        if (sessionDate < classStart || sessionDate > classEnd)
        {
            throw new ValidationException("SessionDate must be within the inclusive class date range.");
        }

        var matchingSchedules = await _attendanceRepository.CountMatchingSchedulesAsync(
            targetClass.Id,
            ToProjectDayOfWeek(sessionDate),
            startTime,
            cancellationToken);

        if (matchingSchedules == 0)
        {
            throw new ValidationException("No current Schedule matches the requested class, weekday, and start time.");
        }
        if (matchingSchedules > 1)
        {
            throw new ConflictException("Multiple Schedules match the requested attendance session.");
        }
    }

    private async Task ValidateNewRecordAsync(
        CourseClass targetClass,
        DateOnly sessionDate,
        int studentId,
        CancellationToken cancellationToken)
    {
        ValidateClassAllowsNewRecord(targetClass, sessionDate);

        var student = await _attendanceRepository.GetStudentAsync(studentId, cancellationToken);
        if (student == null)
        {
            throw new NotFoundException($"Student with ID {studentId} not found.");
        }

        var membership = await _attendanceRepository.GetClassStudentAsync(targetClass.Id, studentId, cancellationToken);
        if (membership == null)
        {
            throw new ValidationException($"Student with ID {studentId} is not a member of class ID {targetClass.Id}.");
        }

        ValidateMembershipAllowsNewRecord(membership, sessionDate);
    }

    private static void ValidateClassAllowsNewRecord(CourseClass targetClass, DateOnly sessionDate)
    {
        if (targetClass.Status != ClassStatus.Ongoing && targetClass.Status != ClassStatus.Completed)
        {
            throw new ValidationException($"New attendance records are not allowed for a class in status {targetClass.Status}.");
        }

        if (targetClass.Status == ClassStatus.Completed)
        {
            var classStart = DateOnly.FromDateTime(targetClass.StartDate);
            var classEnd = DateOnly.FromDateTime(targetClass.EndDate);
            if (sessionDate < classStart || sessionDate > classEnd)
            {
                throw new ValidationException("Completed-class attendance must be within the inclusive class date range.");
            }
        }
    }

    private static void ValidateMembershipAllowsNewRecord(ClassStudent membership, DateOnly sessionDate)
    {
        if (sessionDate < DateOnly.FromDateTime(membership.JoinedAt))
        {
            throw new ValidationException("Attendance cannot be recorded before the student joined the class.");
        }

        if (membership.Status == ClassStudentStatus.Withdrawn)
        {
            throw new ValidationException("New attendance cannot be recorded for a withdrawn class membership.");
        }
    }

    private async Task<AttendanceSessionRosterResponse> BuildRosterAsync(
        CourseClass targetClass,
        AttendanceSession? session,
        DateOnly sessionDate,
        TimeSpan startTime,
        AttendanceActor actor,
        CancellationToken cancellationToken)
    {
        var memberships = await _attendanceRepository.GetClassStudentsAsync(targetClass.Id, cancellationToken);
        var records = session == null
            ? new List<AttendanceRecord>()
            : await _attendanceRepository.GetRecordsBySessionAsync(session.Id, tracked: false, cancellationToken);
        var recordsByStudent = records.ToDictionary(record => record.StudentId);

        var students = memberships.Select(membership =>
        {
            recordsByStudent.TryGetValue(membership.StudentId, out var record);
            var ineligibility = record == null
                ? GetCreationIneligibility(targetClass, membership, sessionDate, session != null, actor)
                : null;

            return new AttendanceRosterItemResponse
            {
                StudentId = membership.StudentId,
                StudentCode = membership.Student.StudentCode,
                StudentName = membership.Student.User.FullName,
                MembershipStatus = membership.Status,
                JoinedAt = membership.JoinedAt,
                CanCreate = record == null && ineligibility == null,
                IneligibilityReason = ineligibility,
                AttendanceId = record?.Id,
                Status = record?.Status,
                Note = record?.Note
            };
        }).ToList();

        return new AttendanceSessionRosterResponse
        {
            AttendanceSessionId = session?.Id,
            ClassId = targetClass.Id,
            ClassCode = targetClass.ClassCode,
            CourseId = targetClass.CourseId,
            CourseCode = targetClass.Course.CourseCode,
            CourseName = targetClass.Course.CourseName,
            TeacherId = targetClass.TeacherId,
            TeacherName = targetClass.Teacher?.User.FullName,
            SessionDate = sessionDate,
            StartTime = startTime,
            CreatedByTeacherId = session?.CreatedBy,
            CreatedByTeacherName = session?.CreatedByTeacher.User.FullName,
            Students = students
        };
    }

    private static string? GetCreationIneligibility(
        CourseClass targetClass,
        ClassStudent membership,
        DateOnly sessionDate,
        bool sessionExists,
        AttendanceActor actor)
    {
        if (targetClass.Status != ClassStatus.Ongoing && targetClass.Status != ClassStatus.Completed)
        {
            return $"Class status {targetClass.Status} does not allow a new attendance record.";
        }
        if (targetClass.Status == ClassStatus.Completed &&
            (sessionDate < DateOnly.FromDateTime(targetClass.StartDate) ||
             sessionDate > DateOnly.FromDateTime(targetClass.EndDate)))
        {
            return "Session date is outside the completed class date range.";
        }
        if (sessionDate < DateOnly.FromDateTime(membership.JoinedAt))
        {
            return "Student had not joined the class on this date.";
        }
        if (membership.Status == ClassStudentStatus.Withdrawn)
        {
            return "Withdrawn membership cannot receive a new attendance record.";
        }
        if (!sessionExists &&
            (targetClass.Teacher == null ||
             targetClass.Teacher.UserId != actor.UserId ||
             targetClass.Teacher.Status != TeacherStatus.Active ||
             !targetClass.Teacher.User.IsActive))
        {
            return "Only the active Teacher currently assigned to the class can create the session.";
        }

        return null;
    }

    private static void ValidateSessionIdentity(int? classId, DateOnly? sessionDate, TimeSpan? startTime)
    {
        if (!classId.HasValue || classId.Value <= 0)
        {
            throw new ValidationException("ClassId must be greater than 0.");
        }
        if (!sessionDate.HasValue)
        {
            throw new ValidationException("SessionDate is required.");
        }
        if (!startTime.HasValue)
        {
            throw new ValidationException("StartTime is required.");
        }
        if (startTime.Value < TimeSpan.Zero || startTime.Value >= MaximumTimeOfDay)
        {
            throw new ValidationException("StartTime must be within a single day.");
        }
    }

    private static void EnsureSessionIsUnambiguous(IReadOnlyCollection<AttendanceSession> sessions)
    {
        if (sessions.Count > 1)
        {
            throw new ConflictException("Multiple AttendanceSessions exist for the same class, date, and start time.");
        }
    }

    private static int ToProjectDayOfWeek(DateOnly date)
    {
        return ((int)date.DayOfWeek + 6) % 7 + 1;
    }

    private static string? NormalizeNote(string? note)
    {
        return string.IsNullOrWhiteSpace(note) ? null : note.Trim();
    }

    private static bool IsTransientConflict(Exception? exception)
    {
        while (exception != null)
        {
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

    private Task SetAttendanceLockTimeoutAsync(CancellationToken cancellationToken)
    {
        return _context.Database.ExecuteSqlRawAsync(
            "SET LOCK_TIMEOUT 1000",
            cancellationToken);
    }
}
