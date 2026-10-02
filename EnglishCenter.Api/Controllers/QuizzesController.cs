using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Questions;
using EnglishCenter.Api.DTOs.QuizAttempts;
using EnglishCenter.Api.DTOs.Quizzes;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizzesController : ControllerBase
{
    private readonly IQuizService _quizService;
    private readonly IQuizQuestionService _questionService;
    private readonly IQuizAttemptService _attemptService;

    public QuizzesController(
        IQuizService quizService,
        IQuizQuestionService questionService,
        IQuizAttemptService attemptService)
    {
        _quizService = quizService;
        _questionService = questionService;
        _attemptService = attemptService;
    }

    [HttpGet]
    [Authorize(Policy = PolicyNames.AccessQuizzes)]
    public async Task<IActionResult> GetList([FromQuery] QuizQuery query, CancellationToken cancellationToken)
    {
        var result = await _quizService.GetListAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<QuizListItemResponse>>.Ok(result, "Quizzes retrieved successfully."));
    }

    [HttpGet("lookups/classes")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> GetTeacherClassesLookup(
        [FromQuery] TeacherQuizClassLookupQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _quizService.GetTeacherClassLookupAsync(query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<TeacherQuizClassLookupItemResponse>>.Ok(result, "Classes retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    [Authorize(Policy = PolicyNames.AccessQuizzes)]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var actor = GetActor();
        if (actor.IsStudent)
        {
            var studentResult = await _quizService.GetStudentDetailAsync(id, actor, cancellationToken);
            return Ok(ApiResponse<StudentQuizDetailResponse>.Ok(studentResult, "Quiz retrieved successfully."));
        }

        var result = await _quizService.GetDetailAsync(id, actor, cancellationToken);
        return Ok(ApiResponse<QuizDetailResponse>.Ok(result, "Quiz retrieved successfully."));
    }

    [HttpPost]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> Create([FromBody] CreateQuizRequest request, CancellationToken cancellationToken)
    {
        var result = await _quizService.CreateAsync(request, GetActor(), cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<QuizDetailResponse>.Ok(result, "Quiz created successfully."));
    }

    [HttpPut("{id:int}")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateQuizRequest request, CancellationToken cancellationToken)
    {
        var result = await _quizService.UpdateAsync(id, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<QuizDetailResponse>.Ok(result, "Quiz updated successfully."));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await _quizService.DeleteAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse.Ok("Quiz deleted successfully."));
    }

    [HttpPost("{id:int}/publish")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> Publish(int id, CancellationToken cancellationToken)
    {
        var result = await _quizService.PublishAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<QuizDetailResponse>.Ok(result, "Quiz published successfully."));
    }

    [HttpPost("{id:int}/close")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> Close(int id, CancellationToken cancellationToken)
    {
        var result = await _quizService.CloseAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<QuizDetailResponse>.Ok(result, "Quiz closed successfully."));
    }

    [HttpPost("{id:int}/reopen")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> Reopen(int id, CancellationToken cancellationToken)
    {
        var result = await _quizService.ReopenAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<QuizDetailResponse>.Ok(result, "Quiz reopened successfully."));
    }

    [HttpGet("{id:int}/questions")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> GetQuestions(int id, CancellationToken cancellationToken)
    {
        var result = await _questionService.GetQuestionsAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<List<QuestionManagementResponse>>.Ok(result, "Questions retrieved successfully."));
    }

    [HttpPost("{id:int}/questions")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> CreateQuestion(int id, [FromBody] CreateQuestionRequest request, CancellationToken cancellationToken)
    {
        var result = await _questionService.CreateAsync(id, request, GetActor(), cancellationToken);
        return StatusCode(StatusCodes.Status201Created, ApiResponse<QuestionManagementResponse>.Ok(result, "Question created successfully."));
    }

    [HttpPut("{id:int}/questions/{questionId:int}")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> UpdateQuestion(int id, int questionId, [FromBody] UpdateQuestionRequest request, CancellationToken cancellationToken)
    {
        var result = await _questionService.UpdateAsync(id, questionId, request, GetActor(), cancellationToken);
        return Ok(ApiResponse<QuestionManagementResponse>.Ok(result, "Question updated successfully."));
    }

    [HttpDelete("{id:int}/questions/{questionId:int}")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> DeleteQuestion(int id, int questionId, CancellationToken cancellationToken)
    {
        await _questionService.DeleteAsync(id, questionId, GetActor(), cancellationToken);
        return Ok(ApiResponse.Ok("Question deleted successfully."));
    }

    [HttpGet("{id:int}/attempts")]
    [Authorize(Policy = PolicyNames.ManageQuizzes)]
    public async Task<IActionResult> GetAttempts(
        int id,
        [FromQuery] QuizAttemptQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _attemptService.GetAttemptsForQuizAsync(id, query, GetActor(), cancellationToken);
        return Ok(ApiResponse<PagedResult<QuizAttemptListItemResponse>>.Ok(result, "Quiz attempts retrieved successfully."));
    }

    [HttpGet("{id:int}/my-attempts")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> GetMyAttempts(int id, CancellationToken cancellationToken)
    {
        var result = await _attemptService.GetMyAttemptsAsync(id, GetActor(), cancellationToken);
        return Ok(ApiResponse<List<StudentAttemptSummaryResponse>>.Ok(result, "My attempts retrieved successfully."));
    }

    [HttpPost("{id:int}/attempts")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> StartAttempt(int id, CancellationToken cancellationToken)
    {
        var (response, created) = await _attemptService.StartAttemptAsync(id, GetActor(), cancellationToken);
        if (created)
        {
            return StatusCode(StatusCodes.Status201Created, ApiResponse<StudentAttemptDetailResponse>.Ok(response, "Quiz attempt started successfully."));
        }

        return Ok(ApiResponse<StudentAttemptDetailResponse>.Ok(response, "Active quiz attempt resumed successfully."));
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
