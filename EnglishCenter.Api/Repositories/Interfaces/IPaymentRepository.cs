using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Payments;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IPaymentRepository
{
    Task<PagedResult<PaymentListItemResponse>> GetPagedAsync(PaymentQuery query, CancellationToken cancellationToken = default);
    Task<PaymentDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Payment?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<Enrollment?> GetEnrollmentByIdAsync(int enrollmentId, CancellationToken cancellationToken = default);
    Task<Enrollment?> GetEnrollmentWithStudentAsync(int enrollmentId, CancellationToken cancellationToken = default);
    Task<decimal> GetEffectivePaidAmountAsync(int enrollmentId, int? excludePaymentId = null, CancellationToken cancellationToken = default);
    Task<PaymentSummaryResponse?> GetPaymentSummaryAsync(int enrollmentId, CancellationToken cancellationToken = default);
    Task<bool> ExistsByTransactionCodeAsync(string transactionCode, int? excludePaymentId = null, CancellationToken cancellationToken = default);
    Task<bool> ExistsByPaymentCodeAsync(string paymentCode, int? excludePaymentId = null, CancellationToken cancellationToken = default);
    Task<Payment?> GetByPaymentCodeAsync(string paymentCode, CancellationToken cancellationToken = default);
    Task<Payment?> GetBySePayTransactionIdAsync(long transactionId, CancellationToken cancellationToken = default);
    Task<Payment?> GetPendingSePayPaymentForEnrollmentAsync(int enrollmentId, CancellationToken cancellationToken = default);
    Task<List<Enrollment>> GetStudentEnrollmentsWithDetailsAsync(int studentId, CancellationToken cancellationToken = default);
    Task AddAsync(Payment payment, CancellationToken cancellationToken = default);
    Task DeleteAsync(Payment payment, CancellationToken cancellationToken = default);
}
