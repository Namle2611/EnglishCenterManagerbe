using EnglishCenter.Api.DTOs.Attendances;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IAttendanceRepository
{
    Task<PagedResult<AttendanceListItemResponse>> GetPagedAsync(AttendanceQuery query, int? teacherUserId, CancellationToken cancellationToken = default);
    Task<AttendanceDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AttendanceRecord?> GetRecordForUpdateAsync(int id, CancellationToken cancellationToken = default);
    Task<CourseClass?> GetClassAsync(int classId, CancellationToken cancellationToken = default);
    Task<Teacher?> GetTeacherByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<Student?> GetStudentAsync(int studentId, CancellationToken cancellationToken = default);
    Task<ClassStudent?> GetClassStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default);
    Task<List<ClassStudent>> GetClassStudentsAsync(int classId, CancellationToken cancellationToken = default);
    Task<List<AttendanceSession>> GetNaturalSessionsAsync(int classId, DateTime sessionDate, TimeSpan startTime, bool lockForUpdate, CancellationToken cancellationToken = default);
    Task<int> CountMatchingSchedulesAsync(int classId, int dayOfWeek, TimeSpan startTime, CancellationToken cancellationToken = default);
    Task<AttendanceRecord?> GetRecordBySessionAndStudentAsync(int attendanceSessionId, int studentId, bool tracked, CancellationToken cancellationToken = default);
    Task<List<AttendanceRecord>> GetRecordsBySessionAsync(int attendanceSessionId, bool tracked, CancellationToken cancellationToken = default);
    Task AddSessionAsync(AttendanceSession attendanceSession, CancellationToken cancellationToken = default);
    Task AddRecordAsync(AttendanceRecord attendanceRecord, CancellationToken cancellationToken = default);
    Task AddRecordsAsync(IEnumerable<AttendanceRecord> attendanceRecords, CancellationToken cancellationToken = default);
    Task<PagedResult<TeacherClassLookupItemResponse>> GetTeacherClassesLookupAsync(TeacherClassLookupQuery query, int teacherUserId, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
