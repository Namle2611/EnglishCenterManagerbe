using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Courses;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageCourses)]
public class CoursesController : ControllerBase
{
    private readonly ICourseService _courseService;

    public CoursesController(ICourseService courseService)
    {
        _courseService = courseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] CourseQuery query, CancellationToken cancellationToken)
    {
        var result = await _courseService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<CourseListItemResponse>>.Ok(result, "Courses retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _courseService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<CourseDetailResponse>.Ok(result, "Course retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCourseRequest request, CancellationToken cancellationToken)
    {
        var result = await _courseService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<CourseDetailResponse>.Ok(result, "Course created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCourseRequest request, CancellationToken cancellationToken)
    {
        var result = await _courseService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<CourseDetailResponse>.Ok(result, "Course updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateCourseStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _courseService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<CourseDetailResponse>.Ok(result, "Course status updated successfully."));
    }
}
