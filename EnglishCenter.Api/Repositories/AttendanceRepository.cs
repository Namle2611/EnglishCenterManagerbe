using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Attendances;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class AttendanceRepository : IAttendanceRepository
{
    private readonly AppDbContext _context;

    public AttendanceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<AttendanceListItemResponse>> GetPagedAsync(
        AttendanceQuery query,
        int? teacherUserId,
        CancellationToken cancellationToken = default)
    {
        var records = _context.AttendanceRecords.AsNoTracking().AsQueryable();

        if (teacherUserId.HasValue)
        {
            records = records.Where(r => r.AttendanceSession.Class.Teacher != null &&
                                         r.AttendanceSession.Class.Teacher.UserId == teacherUserId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            records = records.Where(r =>
                r.Student.StudentCode.Contains(search) ||
                r.Student.User.FullName.Contains(search) ||
                r.AttendanceSession.Class.ClassCode.Contains(search) ||
                r.AttendanceSession.Class.Course.CourseName.Contains(search));
        }

        if (query.ClassId.HasValue)
        {
            records = records.Where(r => r.AttendanceSession.ClassId == query.ClassId.Value);
        }

        if (query.StudentId.HasValue)
        {
            records = records.Where(r => r.StudentId == query.StudentId.Value);
        }

        if (query.CourseId.HasValue)
        {
            records = records.Where(r => r.AttendanceSession.Class.CourseId == query.CourseId.Value);
        }

        if (query.TeacherId.HasValue)
        {
            records = records.Where(r => r.AttendanceSession.Class.TeacherId == query.TeacherId.Value);
        }

        if (query.ParsedStatus.HasValue)
        {
            records = records.Where(r => r.Status == query.ParsedStatus.Value);
        }

        if (query.DateFrom.HasValue)
        {
            var dateFrom = query.DateFrom.Value.ToDateTime(TimeOnly.MinValue);
            records = records.Where(r => r.AttendanceSession.SessionDate >= dateFrom);
        }

        if (query.DateTo.HasValue)
        {
            var dateToExclusive = query.DateTo.Value.AddDays(1).ToDateTime(TimeOnly.MinValue);
            records = records.Where(r => r.AttendanceSession.SessionDate < dateToExclusive);
        }

        var totalItems = await records.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<AttendanceRecord> ordered = sortBy switch
        {
            "id" => ascending ? records.OrderBy(r => r.Id) : records.OrderByDescending(r => r.Id),
            "sessiondate" => ascending
                ? records.OrderBy(r => r.AttendanceSession.SessionDate).ThenBy(r => r.Id)
                : records.OrderByDescending(r => r.AttendanceSession.SessionDate).ThenByDescending(r => r.Id),
            "starttime" => ascending
                ? records.OrderBy(r => r.AttendanceSession.StartTime).ThenBy(r => r.Id)
                : records.OrderByDescending(r => r.AttendanceSession.StartTime).ThenByDescending(r => r.Id),
            "studentcode" => ascending
                ? records.OrderBy(r => r.Student.StudentCode).ThenBy(r => r.Id)
                : records.OrderByDescending(r => r.Student.StudentCode).ThenByDescending(r => r.Id),
            "studentname" => ascending
                ? records.OrderBy(r => r.Student.User.FullName).ThenBy(r => r.Id)
                : records.OrderByDescending(r => r.Student.User.FullName).ThenByDescending(r => r.Id),
            "classcode" => ascending
                ? records.OrderBy(r => r.AttendanceSession.Class.ClassCode).ThenBy(r => r.Id)
                : records.OrderByDescending(r => r.AttendanceSession.Class.ClassCode).ThenByDescending(r => r.Id),
            "status" => ascending
                ? records.OrderBy(r => r.Status).ThenBy(r => r.Id)
                : records.OrderByDescending(r => r.Status).ThenByDescending(r => r.Id),
            _ => records.OrderByDescending(r => r.AttendanceSession.SessionDate)
                .ThenByDescending(r => r.AttendanceSession.StartTime)
                .ThenBy(r => r.Student.StudentCode)
                .ThenByDescending(r => r.Id)
        };

        var rows = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(r => new AttendanceListRow
            {
                Id = r.Id,
                AttendanceSessionId = r.AttendanceSessionId,
                ClassId = r.AttendanceSession.ClassId,
                ClassCode = r.AttendanceSession.Class.ClassCode,
                CourseId = r.AttendanceSession.Class.CourseId,
                CourseCode = r.AttendanceSession.Class.Course.CourseCode,
                CourseName = r.AttendanceSession.Class.Course.CourseName,
                TeacherId = r.AttendanceSession.Class.TeacherId,
                TeacherName = r.AttendanceSession.Class.Teacher != null
                    ? r.AttendanceSession.Class.Teacher.User.FullName
                    : null,
                SessionDate = r.AttendanceSession.SessionDate,
                StartTime = r.AttendanceSession.StartTime,
                StudentId = r.StudentId,
                StudentCode = r.Student.StudentCode,
                StudentName = r.Student.User.FullName,
                Status = r.Status,
                Note = r.Note
            })
            .ToListAsync(cancellationToken);

        var items = rows.Select(MapListRow).ToList();
        return new PagedResult<AttendanceListItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    public async Task<AttendanceDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        var row = await _context.AttendanceRecords
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new AttendanceDetailRow
            {
                Id = r.Id,
                AttendanceSessionId = r.AttendanceSessionId,
                ClassId = r.AttendanceSession.ClassId,
                ClassCode = r.AttendanceSession.Class.ClassCode,
                CourseId = r.AttendanceSession.Class.CourseId,
                CourseCode = r.AttendanceSession.Class.Course.CourseCode,
                CourseName = r.AttendanceSession.Class.Course.CourseName,
                TeacherId = r.AttendanceSession.Class.TeacherId,
                TeacherName = r.AttendanceSession.Class.Teacher != null
                    ? r.AttendanceSession.Class.Teacher.User.FullName
                    : null,
                SessionDate = r.AttendanceSession.SessionDate,
                StartTime = r.AttendanceSession.StartTime,
                StudentId = r.StudentId,
                StudentCode = r.Student.StudentCode,
                StudentName = r.Student.User.FullName,
                Status = r.Status,
                Note = r.Note,
                ClassStatus = r.AttendanceSession.Class.Status,
                ClassStartDate = r.AttendanceSession.Class.StartDate,
                ClassEndDate = r.AttendanceSession.Class.EndDate,
                CreatedByTeacherId = r.AttendanceSession.CreatedBy,
                CreatedByTeacherCode = r.AttendanceSession.CreatedByTeacher.TeacherCode,
                CreatedByTeacherName = r.AttendanceSession.CreatedByTeacher.User.FullName,
                ClassStudentStatus = _context.ClassStudents
                    .Where(cs => cs.ClassId == r.AttendanceSession.ClassId && cs.StudentId == r.StudentId)
                    .Select(cs => (EnglishCenter.Api.Enums.ClassStudentStatus?)cs.Status)
                    .FirstOrDefault(),
                ClassJoinedAt = _context.ClassStudents
                    .Where(cs => cs.ClassId == r.AttendanceSession.ClassId && cs.StudentId == r.StudentId)
                    .Select(cs => (DateTime?)cs.JoinedAt)
                    .FirstOrDefault()
            })
            .FirstOrDefaultAsync(cancellationToken);

        if (row == null)
        {
            return null;
        }

        return new AttendanceDetailResponse
        {
            Id = row.Id,
            AttendanceSessionId = row.AttendanceSessionId,
            ClassId = row.ClassId,
            ClassCode = row.ClassCode,
            CourseId = row.CourseId,
            CourseCode = row.CourseCode,
            CourseName = row.CourseName,
            TeacherId = row.TeacherId,
            TeacherName = row.TeacherName,
            SessionDate = DateOnly.FromDateTime(row.SessionDate),
            StartTime = row.StartTime,
            StudentId = row.StudentId,
            StudentCode = row.StudentCode,
            StudentName = row.StudentName,
            Status = row.Status,
            Note = row.Note,
            ClassStatus = row.ClassStatus,
            ClassStartDate = row.ClassStartDate,
            ClassEndDate = row.ClassEndDate,
            CreatedByTeacherId = row.CreatedByTeacherId,
            CreatedByTeacherCode = row.CreatedByTeacherCode,
            CreatedByTeacherName = row.CreatedByTeacherName,
            ClassStudentStatus = row.ClassStudentStatus,
            ClassJoinedAt = row.ClassJoinedAt
        };
    }

    public async Task<AttendanceRecord?> GetRecordForUpdateAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.AttendanceRecords
            .Include(r => r.AttendanceSession)
                .ThenInclude(s => s.Class)
                    .ThenInclude(c => c.Teacher)
                        .ThenInclude(t => t!.User)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<CourseClass?> GetClassAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .AsNoTracking()
            .Include(c => c.Course)
            .Include(c => c.Teacher)
                .ThenInclude(t => t!.User)
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
    }

    public async Task<Teacher?> GetTeacherByUserIdAsync(int userId, CancellationToken cancellationToken = default)
    {
        return await _context.Teachers
            .AsNoTracking()
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.UserId == userId, cancellationToken);
    }

    public async Task<Student?> GetStudentAsync(int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.Students
            .AsNoTracking()
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId, cancellationToken);
    }

    public async Task<ClassStudent?> GetClassStudentAsync(
        int classId,
        int studentId,
        CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .AsNoTracking()
            .Include(cs => cs.Student)
                .ThenInclude(s => s.User)
            .FirstOrDefaultAsync(cs => cs.ClassId == classId && cs.StudentId == studentId, cancellationToken);
    }

    public async Task<List<ClassStudent>> GetClassStudentsAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .AsNoTracking()
            .Include(cs => cs.Student)
                .ThenInclude(s => s.User)
            .Where(cs => cs.ClassId == classId)
            .OrderBy(cs => cs.Student.StudentCode)
            .ToListAsync(cancellationToken);
    }

    public async Task<List<AttendanceSession>> GetNaturalSessionsAsync(
        int classId,
        DateTime sessionDate,
        TimeSpan startTime,
        bool lockForUpdate,
        CancellationToken cancellationToken = default)
    {
        IQueryable<AttendanceSession> sessions = lockForUpdate
            ? _context.AttendanceSessions.FromSqlInterpolated($@"
                SELECT *
                FROM [AttendanceSessions] WITH (UPDLOCK, HOLDLOCK)
                WHERE [ClassId] = {classId}
                  AND [SessionDate] = {sessionDate}
                  AND [StartTime] = {startTime}")
            : _context.AttendanceSessions.Where(s =>
                s.ClassId == classId && s.SessionDate == sessionDate && s.StartTime == startTime);

        return await sessions
            .AsNoTracking()
            .Include(s => s.CreatedByTeacher)
                .ThenInclude(t => t.User)
            .OrderBy(s => s.Id)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountMatchingSchedulesAsync(
        int classId,
        int dayOfWeek,
        TimeSpan startTime,
        CancellationToken cancellationToken = default)
    {
        return await _context.Schedules
            .AsNoTracking()
            .CountAsync(s => s.ClassId == classId &&
                             s.DayOfWeek == dayOfWeek &&
                             s.StartTime == startTime,
                cancellationToken);
    }

    public async Task<AttendanceRecord?> GetRecordBySessionAndStudentAsync(
        int attendanceSessionId,
        int studentId,
        bool tracked,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AttendanceRecords.AsQueryable();
        if (!tracked)
        {
            query = query.AsNoTracking();
        }

        return await query.FirstOrDefaultAsync(
            r => r.AttendanceSessionId == attendanceSessionId && r.StudentId == studentId,
            cancellationToken);
    }

    public async Task<List<AttendanceRecord>> GetRecordsBySessionAsync(
        int attendanceSessionId,
        bool tracked,
        CancellationToken cancellationToken = default)
    {
        var query = _context.AttendanceRecords.AsQueryable();
        if (!tracked)
        {
            query = query.AsNoTracking();
        }

        return await query
            .Where(r => r.AttendanceSessionId == attendanceSessionId)
            .ToListAsync(cancellationToken);
    }

    public async Task AddSessionAsync(AttendanceSession attendanceSession, CancellationToken cancellationToken = default)
    {
        await _context.AttendanceSessions.AddAsync(attendanceSession, cancellationToken);
    }

    public async Task AddRecordAsync(AttendanceRecord attendanceRecord, CancellationToken cancellationToken = default)
    {
        await _context.AttendanceRecords.AddAsync(attendanceRecord, cancellationToken);
    }

    public async Task AddRecordsAsync(IEnumerable<AttendanceRecord> attendanceRecords, CancellationToken cancellationToken = default)
    {
        await _context.AttendanceRecords.AddRangeAsync(attendanceRecords, cancellationToken);
    }

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<PagedResult<TeacherClassLookupItemResponse>> GetTeacherClassesLookupAsync(
        TeacherClassLookupQuery query,
        int teacherUserId,
        CancellationToken cancellationToken = default)
    {
        var classes = _context.Classes
            .AsNoTracking()
            .Where(c => c.Teacher != null && c.Teacher.UserId == teacherUserId);

        if (query.ClassId.HasValue)
        {
            classes = classes.Where(c => c.Id == query.ClassId.Value);
        }

        if (query.ParsedStatus.HasValue)
        {
            classes = classes.Where(c => c.Status == query.ParsedStatus.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            classes = classes.Where(c => c.ClassCode.Contains(search) ||
                                         c.Course.CourseCode.Contains(search) ||
                                         c.Course.CourseName.Contains(search));
        }

        var totalItems = await classes.CountAsync(cancellationToken);
        var ascending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        IOrderedQueryable<CourseClass> ordered = sortBy switch
        {
            "classcode" => ascending ? classes.OrderBy(c => c.ClassCode).ThenBy(c => c.Id)
                                     : classes.OrderByDescending(c => c.ClassCode).ThenByDescending(c => c.Id),
            "startdate" => ascending ? classes.OrderBy(c => c.StartDate).ThenBy(c => c.Id)
                                     : classes.OrderByDescending(c => c.StartDate).ThenByDescending(c => c.Id),
            "enddate" => ascending ? classes.OrderBy(c => c.EndDate).ThenBy(c => c.Id)
                                   : classes.OrderByDescending(c => c.EndDate).ThenByDescending(c => c.Id),
            "status" => ascending ? classes.OrderBy(c => c.Status).ThenBy(c => c.Id)
                                  : classes.OrderByDescending(c => c.Status).ThenByDescending(c => c.Id),
            _ => classes.OrderByDescending(c => c.StartDate).ThenByDescending(c => c.Id)
        };

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .Select(c => new TeacherClassLookupItemResponse
            {
                ClassId = c.Id,
                ClassCode = c.ClassCode,
                CourseId = c.CourseId,
                CourseCode = c.Course.CourseCode,
                CourseName = c.Course.CourseName,
                Status = c.Status,
                StartDate = c.StartDate,
                EndDate = c.EndDate,
                MaxStudents = c.MaxStudents,
                EnrolledStudentCount = c.ClassStudents.Count(cs => cs.Status == ClassStudentStatus.Active || cs.Status == ClassStudentStatus.Completed),
                Schedules = c.Schedules
                    .OrderBy(s => s.DayOfWeek)
                    .ThenBy(s => s.StartTime)
                    .Select(s => new TeacherClassScheduleResponse
                    {
                        ScheduleId = s.Id,
                        DayOfWeek = s.DayOfWeek,
                        StartTime = s.StartTime,
                        EndTime = s.EndTime,
                        RoomId = s.RoomId,
                        RoomCode = s.Room.RoomCode,
                        RoomName = s.Room.RoomName
                    }).ToList()
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TeacherClassLookupItemResponse>(items, totalItems, query.Page, query.PageSize);
    }

    private static AttendanceListItemResponse MapListRow(AttendanceListRow row)
    {
        return new AttendanceListItemResponse
        {
            Id = row.Id,
            AttendanceSessionId = row.AttendanceSessionId,
            ClassId = row.ClassId,
            ClassCode = row.ClassCode,
            CourseId = row.CourseId,
            CourseCode = row.CourseCode,
            CourseName = row.CourseName,
            TeacherId = row.TeacherId,
            TeacherName = row.TeacherName,
            SessionDate = DateOnly.FromDateTime(row.SessionDate),
            StartTime = row.StartTime,
            StudentId = row.StudentId,
            StudentCode = row.StudentCode,
            StudentName = row.StudentName,
            Status = row.Status,
            Note = row.Note
        };
    }

    private class AttendanceListRow
    {
        public int Id { get; set; }
        public int AttendanceSessionId { get; set; }
        public int ClassId { get; set; }
        public string ClassCode { get; set; } = string.Empty;
        public int CourseId { get; set; }
        public string CourseCode { get; set; } = string.Empty;
        public string CourseName { get; set; } = string.Empty;
        public int? TeacherId { get; set; }
        public string? TeacherName { get; set; }
        public DateTime SessionDate { get; set; }
        public TimeSpan StartTime { get; set; }
        public int StudentId { get; set; }
        public string StudentCode { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public EnglishCenter.Api.Enums.AttendanceStatus Status { get; set; }
        public string? Note { get; set; }
    }

    private sealed class AttendanceDetailRow : AttendanceListRow
    {
        public EnglishCenter.Api.Enums.ClassStatus ClassStatus { get; set; }
        public DateTime ClassStartDate { get; set; }
        public DateTime ClassEndDate { get; set; }
        public int CreatedByTeacherId { get; set; }
        public string CreatedByTeacherCode { get; set; } = string.Empty;
        public string CreatedByTeacherName { get; set; } = string.Empty;
        public EnglishCenter.Api.Enums.ClassStudentStatus? ClassStudentStatus { get; set; }
        public DateTime? ClassJoinedAt { get; set; }
    }
}
