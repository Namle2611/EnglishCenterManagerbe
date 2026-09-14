using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Enrollments;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IEnrollmentRepository
{
    Task<PagedResult<EnrollmentListItemResponse>> GetPagedAsync(EnrollmentQuery query, CancellationToken cancellationToken = default);
    Task<EnrollmentDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Enrollment?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Student?> GetStudentByIdAsync(int studentId, CancellationToken cancellationToken = default);
    Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken cancellationToken = default);
    Task<CourseClass?> GetClassByIdAsync(int classId, CancellationToken cancellationToken = default);
    Task<bool> HasActiveEnrollmentAsync(int studentId, int courseId, int? excludeEnrollmentId = null, CancellationToken cancellationToken = default);
    Task<bool> HasClassStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default);
    Task<int> GetActiveClassStudentCountAsync(int classId, CancellationToken cancellationToken = default);
    Task<bool> HasPaymentsAsync(int enrollmentId, CancellationToken cancellationToken = default);
    Task AddAsync(Enrollment enrollment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Enrollment enrollment, CancellationToken cancellationToken = default);
    Task AddClassStudentAsync(ClassStudent classStudent, CancellationToken cancellationToken = default);
}
