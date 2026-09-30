using EnglishCenter.Api.DTOs.Assignments;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IAssignmentService
{
    Task<PagedResult<AssignmentListItemResponse>> GetListAsync(
        AssignmentQuery query,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<AssignmentDetailResponse> GetDetailAsync(
        int id,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<AssignmentDetailResponse> CreateAsync(
        CreateAssignmentRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<AssignmentDetailResponse> UpdateAsync(
        int id,
        UpdateAssignmentRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        int id,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<PagedResult<TeacherAssignmentClassLookupItemResponse>> GetTeacherAssignmentClassLookupAsync(
        TeacherAssignmentClassLookupQuery query,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);
}
