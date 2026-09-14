using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Schedules;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IScheduleService
{
    Task<PagedResult<ScheduleListItemResponse>> GetListAsync(ScheduleQuery query, CancellationToken cancellationToken = default);
    Task<ScheduleDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<ScheduleDetailResponse> CreateAsync(CreateScheduleRequest request, CancellationToken cancellationToken = default);
    Task<ScheduleDetailResponse> UpdateAsync(int id, UpdateScheduleRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);
}
