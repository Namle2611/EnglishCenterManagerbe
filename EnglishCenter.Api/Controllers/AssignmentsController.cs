using System.Security.Claims;
using EnglishCenter.Api.DTOs.Assignments;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Submissions;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AssignmentsController : ControllerBase
{
    private readonly IAssignmentService _assignmentService;
    private readonly ISubmissionService _submissionService;

    public AssignmentsController(
        IAssignmentService assignmentService,
        ISubmissionService submissionService)
    {
        _assignmentService = assignmentService;
        _submissionService = submissionService;
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.AccessAssignments)]
    public async Task<IActionResult> GetList([FromQuery] AssignmentQuery query, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetListAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<AssignmentListItemResponse>>.Ok(result, "Assignments retrieved successfully."));
    }

    [HttpGet("lookups/classes")]
    [Authorize(Policy = PolicyNames.ManageAssignments)]
    public async Task<IActionResult> GetTeacherClassesLookup(
        [FromQuery] TeacherAssignmentClassLookupQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetTeacherAssignmentClassLookupAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<TeacherAssignmentClassLookupItemResponse>>.Ok(result, "Classes retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = PolicyNames.AccessAssignments)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.GetDetailAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<AssignmentDetailResponse>.Ok(result, "Assignment retrieved successfully."));
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.ManageAssignments)]
    public async Task<IActionResult> Create([FromBody] CreateAssignmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.CreateAsync(request, GetActor(), cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<AssignmentDetailResponse>.Ok(result, "Assignment created successfully."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = PolicyNames.ManageAssignments)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateAssignmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _assignmentService.UpdateAsync(id, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<AssignmentDetailResponse>.Ok(result, "Assignment updated successfully."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = PolicyNames.ManageAssignments)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _assignmentService.DeleteAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse.Ok("Assignment deleted successfully."));
    }

    [HttpGet("{id:int}/submissions")]
    [Authorize(Policy = PolicyNames.ManageAssignments)]
    public async Task<IActionResult> GetSubmissions(
        int id,
        [FromQuery] SubmissionQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _submissionService.GetSubmissionsForAssignmentAsync(id, query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<SubmissionListItemResponse>>.Ok(result, "Submissions retrieved successfully."));
    }

    [HttpGet("{id:int}/my-submission")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> GetMySubmission(int id, CancellationToken cancellationToken)
    {
        var result = await _submissionService.GetMySubmissionAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<SubmissionDetailResponse>.Ok(result, "Submission retrieved successfully."));
    }

    [HttpPost("{id:int}/submissions")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> CreateSubmission(
        int id,
        [FromBody] CreateSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _submissionService.CreateAsync(id, request, GetActor(), cancellationToken);
        return CreatedAtAction(
            nameof(SubmissionsController.GetById),
            "Submissions",
            new { id = result.Id },
            ApiResponse<SubmissionDetailResponse>.Ok(result, "Assignment submitted successfully."));
    }

    private AssignmentActor GetActor()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        return new AssignmentActor
        {
            UserId = userId,
            IsAdmin = User.IsInRole(RoleNames.Admin),
            IsStaff = User.IsInRole(RoleNames.Staff),
            IsTeacher = User.IsInRole(RoleNames.Teacher),
            IsStudent = User.IsInRole(RoleNames.Student)
        };
    }
}
