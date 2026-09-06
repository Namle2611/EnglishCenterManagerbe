using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Teachers;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageTeachers)]
public class TeachersController : ControllerBase
{
    private readonly ITeacherService _teacherService;

    public TeachersController(ITeacherService teacherService)
    {
        _teacherService = teacherService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] TeacherQuery query, CancellationToken cancellationToken)
    {
        var result = await _teacherService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TeacherListItemResponse>>.Ok(result, "Teachers retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _teacherService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<TeacherDetailResponse>.Ok(result, "Teacher retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateTeacherRequest request, CancellationToken cancellationToken)
    {
        var result = await _teacherService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<TeacherDetailResponse>.Ok(result, "Teacher created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateTeacherRequest request, CancellationToken cancellationToken)
    {
        var result = await _teacherService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<TeacherDetailResponse>.Ok(result, "Teacher updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateTeacherStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _teacherService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<TeacherDetailResponse>.Ok(result, "Teacher status updated successfully."));
    }
}
