using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Sections;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageLearningContent)]
public class SectionsController : ControllerBase
{
    private readonly ISectionService _sectionService;

    public SectionsController(ISectionService sectionService)
    {
        _sectionService = sectionService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] SectionQuery query, CancellationToken cancellationToken)
    {
        var result = await _sectionService.GetListAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<SectionListItemResponse>>.Ok(result, "Sections retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _sectionService.GetDetailAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<SectionDetailResponse>.Ok(result, "Section retrieved successfully."));
    }

    [HttpGet("course/{courseId:int}")]
    public async Task<IActionResult> GetCourseSyllabus(int courseId, CancellationToken cancellationToken)
    {
        var result = await _sectionService.GetCourseSyllabusAsync(courseId, GetActor(), cancellationToken);
        return Ok(ApiResponse<CourseSyllabusResponse>.Ok(result, "Course syllabus retrieved successfully."));
    }

    [HttpGet("lookups/courses")]
    public async Task<IActionResult> GetTeacherCoursesLookup(
        [FromQuery] TeacherCourseLookupQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _sectionService.GetTeacherCoursesLookupAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<TeacherCourseLookupItemResponse>>.Ok(result, "Teacher courses retrieved successfully."));
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.MaintainLearningContent)]
    public async Task<IActionResult> Create([FromBody] CreateSectionRequest request, CancellationToken cancellationToken)
    {
        var result = await _sectionService.CreateAsync(request, GetActor(), cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<SectionDetailResponse>.Ok(result, "Section created successfully."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = PolicyNames.MaintainLearningContent)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateSectionRequest request, CancellationToken cancellationToken)
    {
        var result = await _sectionService.UpdateAsync(id, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<SectionDetailResponse>.Ok(result, "Section updated successfully."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = PolicyNames.MaintainLearningContent)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _sectionService.DeleteAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse.Ok("Section deleted successfully."));
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
