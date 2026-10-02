using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.QuizAttempts;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/quiz-attempts")]
public class QuizAttemptsController : ControllerBase
{
    private readonly IQuizAttemptService _attemptService;

    public QuizAttemptsController(IQuizAttemptService attemptService)
    {
        _attemptService = attemptService;
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = PolicyNames.AccessQuizzes)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _attemptService.GetAttemptDetailAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<object>.Ok(result, "Quiz attempt retrieved successfully."));
    }

    [HttpPut("{id:int}/answers/{questionId:int}")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> SaveAnswer(
        int id,
        int questionId,
        [FromBody] SaveAnswerRequest request,
        CancellationToken cancellationToken)
    {
        var result = await _attemptService.SaveAnswerAsync(id, questionId, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<StudentAnswerResponse>.Ok(result, "Answer saved successfully."));
    }

    [HttpPost("{id:int}/submit")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> Submit(int id, CancellationToken cancellationToken)
    {
        var result = await _attemptService.SubmitAttemptAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<object>.Ok(result, "Quiz attempt submitted successfully."));
    }

    private QuizActor GetActor()
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        return new QuizActor
        {
            UserId = userId,
            IsAdmin = User.IsInRole(RoleNames.Admin),
            IsStaff = User.IsInRole(RoleNames.Staff),
            IsTeacher = User.IsInRole(RoleNames.Teacher),
            IsStudent = User.IsInRole(RoleNames.Student)
        };
    }
}
