using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Lessons;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageLearningContent)]
public class LessonsController : ControllerBase
{
    private readonly ILessonService _lessonService;

    public LessonsController(ILessonService lessonService)
    {
        _lessonService = lessonService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] LessonQuery query, CancellationToken cancellationToken)
    {
        var result = await _lessonService.GetListAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<LessonListItemResponse>>.Ok(result, "Lessons retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _lessonService.GetDetailAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<LessonDetailResponse>.Ok(result, "Lesson retrieved successfully."));
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.MaintainLearningContent)]
    public async Task<IActionResult> Create([FromBody] CreateLessonRequest request, CancellationToken cancellationToken)
    {
        var result = await _lessonService.CreateAsync(request, GetActor(), cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<LessonDetailResponse>.Ok(result, "Lesson created successfully."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = PolicyNames.MaintainLearningContent)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateLessonRequest request, CancellationToken cancellationToken)
    {
        var result = await _lessonService.UpdateAsync(id, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<LessonDetailResponse>.Ok(result, "Lesson updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Policy = PolicyNames.MaintainLearningContent)]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateLessonStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _lessonService.UpdateStatusAsync(id, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<LessonDetailResponse>.Ok(result, "Lesson status updated successfully."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = PolicyNames.MaintainLearningContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _lessonService.DeleteAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse.Ok("Lesson deleted successfully."));
    }

    private LearningContentActor GetActor()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        return new LearningContentActor
        {
            UserId = userId,
            IsAdmin = User.IsInRole(RoleNames.Admin),
            IsStaff = User.IsInRole(RoleNames.Staff),
            IsTeacher = User.IsInRole(RoleNames.Teacher)
        };
    }
}
