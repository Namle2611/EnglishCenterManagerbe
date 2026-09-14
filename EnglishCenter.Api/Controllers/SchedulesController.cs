using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Schedules;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageSchedules)]
public class SchedulesController : ControllerBase
{
    private readonly IScheduleService _scheduleService;

    public SchedulesController(IScheduleService scheduleService)
    {
        _scheduleService = scheduleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] ScheduleQuery query, CancellationToken cancellationToken)
    {
        var result = await _scheduleService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ScheduleListItemResponse>>.Ok(result, "Schedules retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _scheduleService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<ScheduleDetailResponse>.Ok(result, "Schedule retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateScheduleRequest request, CancellationToken cancellationToken)
    {
        var result = await _scheduleService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<ScheduleDetailResponse>.Ok(result, "Schedule created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateScheduleRequest request, CancellationToken cancellationToken)
    {
        var result = await _scheduleService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<ScheduleDetailResponse>.Ok(result, "Schedule updated successfully."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _scheduleService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
