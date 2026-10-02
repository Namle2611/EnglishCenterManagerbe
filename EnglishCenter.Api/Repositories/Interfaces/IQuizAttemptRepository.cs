using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.QuizAttempts;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IQuizAttemptRepository
{
    Task<QuizAttempt?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<QuizAttempt?> GetByIdForUpdateAsync(int id, CancellationToken cancellationToken = default);
    Task<QuizAttempt?> GetActiveInProgressAttemptAsync(int quizId, int studentId, CancellationToken cancellationToken = default);
    Task<int> GetAttemptCountAsync(int quizId, int studentId, CancellationToken cancellationToken = default);
    Task<PagedResult<QuizAttemptListItemResponse>> GetPagedAsync(int quizId, QuizAttemptQuery query, CancellationToken cancellationToken = default);
    Task<List<StudentAttemptSummaryResponse>> GetStudentAttemptsAsync(int quizId, int studentId, bool reviewUnlocked, CancellationToken cancellationToken = default);
    Task<StudentAttemptDetailResponse?> GetStudentAttemptDetailAsync(int attemptId, CancellationToken cancellationToken = default);
    Task<StudentOpenQuizResultResponse?> GetStudentOpenResultAsync(int attemptId, CancellationToken cancellationToken = default);
    Task<StudentAttemptReviewResponse?> GetStudentAttemptReviewAsync(int attemptId, CancellationToken cancellationToken = default);
    Task<ManagementAttemptDetailResponse?> GetManagementAttemptDetailAsync(int attemptId, CancellationToken cancellationToken = default);
    Task<QuizAnswer?> GetAnswerAsync(int attemptId, int questionId, CancellationToken cancellationToken = default);
    Task<Student?> GetStudentByUserIdAsync(int userId, CancellationToken cancellationToken = default);
    Task<ClassStudent?> GetClassStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default);
    Task AddAttemptAsync(QuizAttempt attempt, CancellationToken cancellationToken = default);
    Task AddAnswerAsync(QuizAnswer answer, CancellationToken cancellationToken = default);
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
