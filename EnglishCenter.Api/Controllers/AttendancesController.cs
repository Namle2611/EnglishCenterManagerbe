using System.Security.Claims;
using EnglishCenter.Api.DTOs.Attendances;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageAttendance)]
public class AttendancesController : ControllerBase
{
    private readonly IAttendanceService _attendanceService;

    public AttendancesController(IAttendanceService attendanceService)
    {
        _attendanceService = attendanceService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] AttendanceQuery query, CancellationToken cancellationToken)
    {
        var result = await _attendanceService.GetListAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<AttendanceListItemResponse>>.Ok(
            result,
            "Attendance records retrieved successfully."));
    }

    [HttpGet("session")]
    public async Task<IActionResult> GetSessionRoster(
        [FromQuery] AttendanceSessionQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _attendanceService.GetSessionRosterAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<AttendanceSessionRosterResponse>.Ok(
            result,
            "Attendance roster retrieved successfully."));
    }

    [HttpGet("lookups/classes")]
    public async Task<IActionResult> GetTeacherClassesLookup(
        [FromQuery] TeacherClassLookupQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _attendanceService.GetTeacherClassesLookupAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<TeacherClassLookupItemResponse>>.Ok(
            result,
            "Teacher classes retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _attendanceService.GetDetailAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<AttendanceDetailResponse>.Ok(
            result,
            "Attendance record retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create(
        [FromBody] CreateAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _attendanceService.CreateAsync(request, GetActor(), cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<AttendanceDetailResponse>.Ok(result, "Attendance record created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _attendanceService.UpdateAsync(id, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<AttendanceDetailResponse>.Ok(
            result,
            "Attendance record updated successfully."));
    }

    [HttpPut("session")]
    public async Task<IActionResult> BulkUpsert(
        [FromBody] BulkUpsertAttendanceRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _attendanceService.BulkUpsertAsync(request, GetActor(), cancellationToken);
        return Ok(ApiResponse<AttendanceSessionRosterResponse>.Ok(
            result,
            "Attendance session saved successfully."));
    }

    private AttendanceActor GetActor()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        return new AttendanceActor
        {
            UserId = userId,
            IsAdmin = User.IsInRole(RoleNames.Admin),
            IsStaff = User.IsInRole(RoleNames.Staff),
            IsTeacher = User.IsInRole(RoleNames.Teacher)
        };
    }
}
