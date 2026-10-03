using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.QuizAi;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/ai/quizzes")]
public class QuizAiController : ControllerBase
{
    private readonly IQuizAiService _quizAiService;

    public QuizAiController(IQuizAiService quizAiService)
    {
        _quizAiService = quizAiService;
    }

    [HttpPost("{quizId:int}/generate-questions")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> GenerateQuestions(
        int quizId,
        [FromBody] GenerateQuizQuestionsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _quizAiService.GenerateQuestionsAsync(quizId, request, GetActor(), cancellationToken);
            return Ok(ApiResponse<GeneratedQuizQuestionsResponse>.Ok(result, "Questions generated successfully."));
        }
        catch (QuizAiException ex)
        {
            return StatusCode(ex.StatusCode, ApiResponse.Fail(ex.Message));
        }
    }

    [HttpPost("{quizId:int}/apply-questions")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> ApplyQuestions(
        int quizId,
        [FromBody] ApplyGeneratedQuestionsRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _quizAiService.ApplyQuestionsAsync(quizId, request, GetActor(), cancellationToken);
            return StatusCode(
                StatusCodes.Status201Created,
                ApiResponse<List<QuestionManagementResponse>>.Ok(result, "Generated questions applied successfully."));
        }
        catch (QuizAiException ex)
        {
            return StatusCode(ex.StatusCode, ApiResponse.Fail(ex.Message));
        }
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
