using System.Security.Claims;
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
public class SubmissionsController : ControllerBase
{
    private readonly ISubmissionService _submissionService;

    public SubmissionsController(ISubmissionService submissionService)
    {
        _submissionService = submissionService;
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = PolicyNames.AccessAssignments)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _submissionService.GetDetailAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<SubmissionDetailResponse>.Ok(result, "Submission retrieved successfully."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> Update(
        int id,
        [FromBody] UpdateSubmissionRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _submissionService.UpdateAsync(id, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<SubmissionDetailResponse>.Ok(result, "Submission updated successfully."));
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
