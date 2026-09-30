using EnglishCenter.Api.DTOs.Assignments;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IAssignmentRepository
{
    Task<PagedResult<AssignmentListItemResponse>> GetPagedAsync(
        AssignmentQuery query,
        int? teacherUserScope,
        int? studentUserScope,
        CancellationToken cancellationToken = default);

    Task<AssignmentDetailResponse?> GetDetailByIdAsync(
        int id,
        int? studentUserScope = null,
        CancellationToken cancellationToken = default);

    Task<Assignment?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default);

    Task<CourseClass?> GetClassAsync(int classId, CancellationToken cancellationToken = default);

    Task<PagedResult<TeacherAssignmentClassLookupItemResponse>> GetTeacherAssignmentClassLookupAsync(
        TeacherAssignmentClassLookupQuery query,
        int? teacherUserId,
        CancellationToken cancellationToken = default);

    Task<bool> HasSubmissionsAsync(int assignmentId, CancellationToken cancellationToken = default);

    Task<bool> HasDuplicateTitleAsync(
        int classId,
        string normalizedTitle,
        int? excludeId = null,
        CancellationToken cancellationToken = default);

    Task AddAsync(Assignment assignment, CancellationToken cancellationToken = default);

    void Remove(Assignment assignment);

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
