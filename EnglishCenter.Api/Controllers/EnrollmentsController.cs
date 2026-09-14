using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Enrollments;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageEnrollments)]
public class EnrollmentsController : ControllerBase
{
    private readonly IEnrollmentService _enrollmentService;

    public EnrollmentsController(IEnrollmentService enrollmentService)
    {
        _enrollmentService = enrollmentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] EnrollmentQuery query, CancellationToken cancellationToken)
    {
        var result = await _enrollmentService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<EnrollmentListItemResponse>>.Ok(result, "Enrollments retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _enrollmentService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<EnrollmentDetailResponse>.Ok(result, "Enrollment retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEnrollmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _enrollmentService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<EnrollmentDetailResponse>.Ok(result, "Enrollment created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateEnrollmentRequest request, CancellationToken cancellationToken)
    {
        var result = await _enrollmentService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<EnrollmentDetailResponse>.Ok(result, "Enrollment updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateEnrollmentStatusRequest request, CancellationToken cancellationToken)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdStr, out var currentUserId))
        {
            return Unauthorized(ApiResponse.Fail("Unauthorized."));
        }

        var result = await _enrollmentService.UpdateStatusAsync(id, request, currentUserId, cancellationToken);
        return Ok(ApiResponse<EnrollmentDetailResponse>.Ok(result, "Enrollment status updated successfully."));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _enrollmentService.DeleteAsync(id, cancellationToken);
        return NoContent();
    }
}
