using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Schedules;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IScheduleRepository
{
    Task<PagedResult<ScheduleListItemResponse>> GetPagedAsync(ScheduleQuery query, CancellationToken cancellationToken = default);
    Task<ScheduleDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Schedule?> GetByIdTrackedAsync(int id, CancellationToken cancellationToken = default);
    Task<CourseClass?> GetClassByIdAsync(int classId, CancellationToken cancellationToken = default);
    Task<Room?> GetRoomByIdAsync(int roomId, CancellationToken cancellationToken = default);
    Task<bool> HasRoomConflictAsync(int roomId, int dayOfWeek, TimeSpan startTime, TimeSpan endTime, DateTime classStartDate, DateTime classEndDate, int? excludeScheduleId = null, CancellationToken cancellationToken = default);
    Task<bool> HasClassConflictAsync(int classId, int dayOfWeek, TimeSpan startTime, TimeSpan endTime, int? excludeScheduleId = null, CancellationToken cancellationToken = default);
    Task<bool> HasTeacherConflictAsync(int teacherId, int dayOfWeek, TimeSpan startTime, TimeSpan endTime, DateTime classStartDate, DateTime classEndDate, int? excludeScheduleId = null, CancellationToken cancellationToken = default);
    Task AddAsync(Schedule schedule, CancellationToken cancellationToken = default);
    void Remove(Schedule schedule);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
