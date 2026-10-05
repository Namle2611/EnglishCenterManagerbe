using EnglishCenter.Api.DTOs.Grades;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IGradeService
{
    Task<ClassGradebookResponse> GetClassGradebookAsync(
        int classId,
        GradeQuery query,
        GradeActor actor,
        CancellationToken cancellationToken = default);

    Task<StudentClassGradeDetailResponse> GetStudentClassGradeDetailForManagementAsync(
        int classId,
        int studentId,
        GradeActor actor,
        CancellationToken cancellationToken = default);

    Task<List<StudentGradeSummaryResponse>> GetMyGradesAsync(
        GradeActor actor,
        CancellationToken cancellationToken = default);

    Task<StudentClassGradeDetailResponse> GetMyClassGradeDetailAsync(
        int classId,
        GradeActor actor,
        CancellationToken cancellationToken = default);
}
