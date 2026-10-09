using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Registration;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/admin/registration-requests")]
[Authorize(Roles = RoleNames.Admin)]
public class AdminRegistrationController : ControllerBase
{
    private readonly IRegistrationService _registrationService;

    public AdminRegistrationController(IRegistrationService registrationService)
    {
        _registrationService = registrationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetRequests([FromQuery] RegistrationRequestQuery query, CancellationToken cancellationToken)
    {
        var result = await _registrationService.GetAdminRequestsAsync(query, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> ApproveRequest(
        [FromRoute] int id,
        [FromBody] ApproveRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(adminIdStr, out var adminUserId))
        {
            return Unauthorized(ApiResponse.Fail("Không có quyền truy cập."));
        }

        var result = await _registrationService.ApproveRequestAsync(id, adminUserId, request, cancellationToken);
        if (!result.Success)
        {
            if (result.Message.Contains("đã tồn tại") || result.Message.Contains("đã được xử lý"))
            {
                return Conflict(result);
            }
            return BadRequest(result);
        }

        return Ok(result);
    }

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> RejectRequest(
        [FromRoute] int id,
        [FromBody] RejectRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        var adminIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(adminIdStr, out var adminUserId))
        {
            return Unauthorized(ApiResponse.Fail("Không có quyền truy cập."));
        }

        var result = await _registrationService.RejectRequestAsync(id, adminUserId, request, cancellationToken);
        if (!result.Success)
        {
            return BadRequest(result);
        }

        return Ok(result);
    }
}
