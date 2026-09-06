using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Students;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageStudents)]
public class StudentsController : ControllerBase
{
    private readonly IStudentService _studentService;

    public StudentsController(IStudentService studentService)
    {
        _studentService = studentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] StudentQuery query, CancellationToken cancellationToken)
    {
        var result = await _studentService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<StudentListItemResponse>>.Ok(result, "Students retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _studentService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<StudentDetailResponse>.Ok(result, "Student retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateStudentRequest request, CancellationToken cancellationToken)
    {
        var result = await _studentService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<StudentDetailResponse>.Ok(result, "Student created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateStudentRequest request, CancellationToken cancellationToken)
    {
        var result = await _studentService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<StudentDetailResponse>.Ok(result, "Student updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStudentStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _studentService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<StudentDetailResponse>.Ok(result, "Student status updated successfully."));
    }
}
