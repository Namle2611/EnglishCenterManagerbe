using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Submissions;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface ISubmissionRepository
{
    Task<PagedResult<SubmissionListItemResponse>> GetPagedAsync(
        int assignmentId,
        SubmissionQuery query,
        CancellationToken cancellationToken = default);

    Task<SubmissionDetailResponse?> GetDetailByIdAsync(
        int id,
        CancellationToken cancellationToken = default);

    Task<Submission?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default);
    Task<Submission?> GetByIdAndAssignmentForUpdateAsync(int id, int assignmentId, CancellationToken cancellationToken = default);

    Task<Submission?> GetByAssignmentAndStudentAsync(
        int assignmentId,
        int studentId,
        CancellationToken cancellationToken = default);

    Task<Student?> GetStudentByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    Task<ClassStudent?> GetClassStudentAsync(
        int classId,
        int studentId,
        CancellationToken cancellationToken = default);

    Task AddAsync(Submission submission, CancellationToken cancellationToken = default);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
