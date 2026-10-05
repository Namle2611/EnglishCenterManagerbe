using System.Security.Claims;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Grades;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GradesController : ControllerBase
{
    private readonly IGradeService _gradeService;

    public GradesController(IGradeService gradeService)
    {
        _gradeService = gradeService;
    }

    [HttpGet("classes/{classId:int}")]
    [Authorize(Policy = PolicyNames.AccessGrades)]
    public async Task<IActionResult> GetClassGradebook(
        int classId,
        [FromQuery] GradeQuery query,
        CancellationToken cancellationToken)
    {
        var result = await _gradeService.GetClassGradebookAsync(classId, query, GetActor(), cancellationToken);
        return Ok(ApiResponse<ClassGradebookResponse>.Ok(result, "Class gradebook retrieved successfully."));
    }

    [HttpGet("classes/{classId:int}/students/{studentId:int}")]
    [Authorize(Policy = PolicyNames.AccessGrades)]
    public async Task<IActionResult> GetStudentClassGradeDetail(
        int classId,
        int studentId,
        CancellationToken cancellationToken)
    {
        var result = await _gradeService.GetStudentClassGradeDetailForManagementAsync(classId, studentId, GetActor(), cancellationToken);
        return Ok(ApiResponse<StudentClassGradeDetailResponse>.Ok(result, "Student class grade detail retrieved successfully."));
    }

    [HttpGet("my")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> GetMyGrades(CancellationToken cancellationToken)
    {
        var result = await _gradeService.GetMyGradesAsync(GetActor(), cancellationToken);
        return Ok(ApiResponse<List<StudentGradeSummaryResponse>>.Ok(result, "Student grades retrieved successfully."));
    }

    [HttpGet("my/classes/{classId:int}")]
    [Authorize(Roles = RoleNames.Student)]
    public async Task<IActionResult> GetMyClassGradeDetail(
        int classId,
        CancellationToken cancellationToken)
    {
        var result = await _gradeService.GetMyClassGradeDetailAsync(classId, GetActor(), cancellationToken);
        return Ok(ApiResponse<StudentClassGradeDetailResponse>.Ok(result, "Student class grade detail retrieved successfully."));
    }

    private GradeActor GetActor()
    {
        var user = User;
        if (user == null)
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        var userIdValue = user.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId))
        {
            throw new UnauthorizedAccessException("Unauthorized.");
        }

        return new GradeActor
        {
            UserId = userId,
            IsAdmin = user.IsInRole(RoleNames.Admin),
            IsStaff = user.IsInRole(RoleNames.Staff),
            IsTeacher = user.IsInRole(RoleNames.Teacher),
            IsStudent = user.IsInRole(RoleNames.Student)
        };
    }
}
