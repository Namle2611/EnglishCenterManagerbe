using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Quizzes;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IQuizRepository
{
    Task<PagedResult<QuizListItemResponse>> GetPagedAsync(
        QuizQuery query,
        int? teacherUserId,
        int? studentUserId,
        CancellationToken cancellationToken = default);

    Task<PagedResult<TeacherQuizClassLookupItemResponse>> GetTeacherClassLookupAsync(
        TeacherQuizClassLookupQuery query,
        int? teacherUserId,
        CancellationToken cancellationToken = default);

    Task<Quiz?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Quiz?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default);
    Task<QuizDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<StudentQuizDetailResponse?> GetStudentDetailByIdAsync(int id, int studentUserId, CancellationToken cancellationToken = default);
    Task<CourseClass?> GetClassAsync(int classId, CancellationToken cancellationToken = default);
    Task<bool> HasDuplicateTitleAsync(int classId, string title, int? excludeId = null, CancellationToken cancellationToken = default);
    Task<bool> HasAttemptsAsync(int quizId, CancellationToken cancellationToken = default);
    Task<bool> HasLiveAttemptsAsync(int quizId, DateTime utcNow, CancellationToken cancellationToken = default);
    Task<List<QuizAttempt>> GetStaleInProgressAttemptsAsync(int quizId, DateTime utcNow, CancellationToken cancellationToken = default);
    Task<List<QuizAttempt>> GetInProgressAttemptsByClassIdsAsync(IReadOnlyCollection<int> classIds, CancellationToken cancellationToken = default);
    Task<Question?> GetQuestionByIdAsync(int questionId, CancellationToken cancellationToken = default);
    Task<List<Question>> GetQuestionsByQuizIdAsync(int quizId, CancellationToken cancellationToken = default);
    Task AddAsync(Quiz quiz, CancellationToken cancellationToken = default);
    void Remove(Quiz quiz);
    void RemoveQuestion(Question question);
    void RemoveQuestionOptions(IEnumerable<QuestionOption> options);
    Task AddQuestionAsync(Question question, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
