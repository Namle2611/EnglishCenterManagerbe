using EnglishCenter.Api.DTOs.Classes;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishCenter.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Policy = PolicyNames.ManageClasses)]
public class ClassesController : ControllerBase
{
    private readonly IClassService _classService;

    public ClassesController(IClassService classService)
    {
        _classService = classService;
    }

    [HttpGet]
    public async Task<IActionResult> GetList([FromQuery] ClassQuery query, CancellationToken cancellationToken)
    {
        var result = await _classService.GetListAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<ClassListItemResponse>>.Ok(result, "Classes retrieved successfully."));
    }

    [HttpGet("lookups/teachers")]
    public async Task<IActionResult> GetTeacherLookup([FromQuery] TeacherLookupQuery query, CancellationToken cancellationToken)
    {
        var result = await _classService.GetTeacherLookupAsync(query, cancellationToken);
        return Ok(ApiResponse<PagedResult<TeacherLookupItemResponse>>.Ok(result, "Teachers retrieved successfully."));
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id, CancellationToken cancellationToken)
    {
        var result = await _classService.GetDetailAsync(id, cancellationToken);
        return Ok(ApiResponse<ClassDetailResponse>.Ok(result, "Class retrieved successfully."));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateClassRequest request, CancellationToken cancellationToken)
    {
        var result = await _classService.CreateAsync(request, cancellationToken);
        return CreatedAtAction(
            nameof(GetById),
            new { id = result.Id },
            ApiResponse<ClassDetailResponse>.Ok(result, "Class created successfully."));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateClassRequest request, CancellationToken cancellationToken)
    {
        var result = await _classService.UpdateAsync(id, request, cancellationToken);
        return Ok(ApiResponse<ClassDetailResponse>.Ok(result, "Class updated successfully."));
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateClassStatusRequest request, CancellationToken cancellationToken)
    {
        var result = await _classService.UpdateStatusAsync(id, request, cancellationToken);
        return Ok(ApiResponse<ClassDetailResponse>.Ok(result, "Class status updated successfully."));
    }
}
