using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Payments;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IPaymentService
{
    Task<PagedResult<PaymentListItemResponse>> GetListAsync(PaymentQuery query, CancellationToken cancellationToken = default);
    Task<PaymentDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default);
    Task<PaymentSummaryResponse> GetSummaryByEnrollmentIdAsync(int enrollmentId, CancellationToken cancellationToken = default);
    Task<PaymentDetailResponse> CreateAsync(CreatePaymentRequest request, CancellationToken cancellationToken = default);
    Task<PaymentDetailResponse> UpdateAsync(int id, UpdatePaymentRequest request, CancellationToken cancellationToken = default);
    Task<PaymentDetailResponse> UpdateStatusAsync(int id, UpdatePaymentStatusRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(int id, CancellationToken cancellationToken = default);

    // SePay VietQR methods
    Task<SePayPaymentResponse> GetOrCreateStudentSePayPaymentAsync(int enrollmentId, int currentUserId, CancellationToken cancellationToken = default);
    Task<SePayPaymentResponse> GetStudentSePayPaymentAsync(int enrollmentId, int currentUserId, CancellationToken cancellationToken = default);
    Task<List<StudentTuitionEnrollmentResponse>> GetStudentTuitionsAsync(int currentUserId, CancellationToken cancellationToken = default);
    Task<PaymentStatusCheckResponse> GetPaymentStatusAsync(int paymentId, int currentUserId, bool isStaffOrAdmin, CancellationToken cancellationToken = default);
    Task<bool> ProcessSePayWebhookAsync(SePayWebhookPayload payload, CancellationToken cancellationToken = default);
}
