using EnglishCenter.Api.DTOs.Grades;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IGradeRepository
{
    Task<CourseClass?> GetClassWithDetailsAsync(int classId, CancellationToken cancellationToken = default);

    Task<ClassStudent?> GetClassStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default);

    Task<Student?> GetStudentByUserIdAsync(int userId, CancellationToken cancellationToken = default);

    Task<List<ClassStudent>> GetStudentEnrolledClassesAsync(int studentId, CancellationToken cancellationToken = default);

    Task<(List<ClassStudent> Items, int TotalCount)> GetPagedClassRosterAsync(
        int classId,
        GradeQuery query,
        CancellationToken cancellationToken = default);

    Task<List<Assignment>> GetAssignmentsByClassIdAsync(int classId, CancellationToken cancellationToken = default);

    Task<List<Assignment>> GetAssignmentsByClassIdsAsync(IReadOnlyCollection<int> classIds, CancellationToken cancellationToken = default);

    Task<List<Quiz>> GetQuizzesByClassIdAsync(int classId, CancellationToken cancellationToken = default);

    Task<List<Quiz>> GetQuizzesByClassIdsAsync(IReadOnlyCollection<int> classIds, CancellationToken cancellationToken = default);

    Task<List<Submission>> GetSubmissionsByClassAndStudentsAsync(
        int classId,
        IReadOnlyCollection<int> studentIds,
        CancellationToken cancellationToken = default);

    Task<List<Submission>> GetSubmissionsByStudentAndClassesAsync(
        int studentId,
        IReadOnlyCollection<int> classIds,
        CancellationToken cancellationToken = default);

    Task<List<QuizAttempt>> GetAttemptsByClassAndStudentsAsync(
        int classId,
        IReadOnlyCollection<int> studentIds,
        CancellationToken cancellationToken = default);

    Task<List<QuizAttempt>> GetAttemptsByStudentAndClassesAsync(
        int studentId,
        IReadOnlyCollection<int> classIds,
        CancellationToken cancellationToken = default);
}
