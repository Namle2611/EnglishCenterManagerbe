using EnglishCenter.Api.DTOs.Attendances;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IAttendanceService
{
    Task<PagedResult<AttendanceListItemResponse>> GetListAsync(AttendanceQuery query, AttendanceActor actor, CancellationToken cancellationToken = default);
    Task<AttendanceDetailResponse> GetDetailAsync(int id, AttendanceActor actor, CancellationToken cancellationToken = default);
    Task<AttendanceSessionRosterResponse> GetSessionRosterAsync(AttendanceSessionQuery query, AttendanceActor actor, CancellationToken cancellationToken = default);
    Task<AttendanceDetailResponse> CreateAsync(CreateAttendanceRequest request, AttendanceActor actor, CancellationToken cancellationToken = default);
    Task<AttendanceDetailResponse> UpdateAsync(int id, UpdateAttendanceRequest request, AttendanceActor actor, CancellationToken cancellationToken = default);
    Task<AttendanceSessionRosterResponse> BulkUpsertAsync(BulkUpsertAttendanceRequest request, AttendanceActor actor, CancellationToken cancellationToken = default);
    Task<PagedResult<TeacherClassLookupItemResponse>> GetTeacherClassesLookupAsync(TeacherClassLookupQuery query, AttendanceActor actor, CancellationToken cancellationToken = default);
}
