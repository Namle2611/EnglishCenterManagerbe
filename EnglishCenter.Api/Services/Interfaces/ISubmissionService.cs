using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Submissions;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface ISubmissionService
{
    Task<PagedResult<SubmissionListItemResponse>> GetSubmissionsForAssignmentAsync(
        int assignmentId,
        SubmissionQuery query,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<SubmissionDetailResponse> GetDetailAsync(
        int id,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<SubmissionDetailResponse> GetMySubmissionAsync(
        int assignmentId,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<SubmissionDetailResponse> CreateAsync(
        int assignmentId,
        CreateSubmissionRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);

    Task<SubmissionDetailResponse> UpdateAsync(
        int id,
        UpdateSubmissionRequest request,
        AssignmentActor actor,
        CancellationToken cancellationToken = default);
}
