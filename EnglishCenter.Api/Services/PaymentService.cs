using System.Data;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Payments;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class PaymentService : IPaymentService
{
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly IPaymentRepository _paymentRepository;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        AppDbContext context,
        IPaymentRepository paymentRepository,
        ILogger<PaymentService> logger)
    {
        _context = context;
        _paymentRepository = paymentRepository;
        _logger = logger;
    }

    public async Task<PagedResult<PaymentListItemResponse>> GetListAsync(PaymentQuery query, CancellationToken cancellationToken = default)
    {
        return await _paymentRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<PaymentDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var detail = await _paymentRepository.GetDetailByIdAsync(id, cancellationToken);
        if (detail == null)
        {
            throw new NotFoundException($"Payment with ID {id} not found.");
        }

        return detail;
    }

    public async Task<PaymentSummaryResponse> GetSummaryByEnrollmentIdAsync(int enrollmentId, CancellationToken cancellationToken = default)
    {
        var summary = await _paymentRepository.GetPaymentSummaryAsync(enrollmentId, cancellationToken);
        if (summary == null)
        {
            throw new NotFoundException($"Enrollment with ID {enrollmentId} not found.");
        }

        return summary;
    }

    public async Task<PaymentDetailResponse> CreateAsync(CreatePaymentRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.EnrollmentId.HasValue || request.EnrollmentId.Value <= 0)
        {
            throw new ValidationException("EnrollmentId must be greater than 0.");
        }

        if (!request.Amount.HasValue || request.Amount.Value <= 0)
        {
            throw new ValidationException("Amount must be greater than 0.");
        }

        if (!request.PaymentMethod.HasValue)
        {
            throw new ValidationException("PaymentMethod is required.");
        }

        var transactionCode = string.IsNullOrWhiteSpace(request.TransactionCode) ? null : request.TransactionCode.Trim();
        var note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                // 1. Transaction code uniqueness precheck
                if (transactionCode != null)
                {
                    var codeExists = await _paymentRepository.ExistsByTransactionCodeAsync(transactionCode, null, cancellationToken);
                    if (codeExists)
                    {
                        throw new ConflictException("Transaction code already exists.");
                    }
                }

                // 2. Validate Target Enrollment
                var enrollment = await _paymentRepository.GetEnrollmentByIdAsync(request.EnrollmentId.Value, cancellationToken);
                if (enrollment == null)
                {
                    throw new NotFoundException($"Enrollment with ID {request.EnrollmentId.Value} not found.");
                }

                if (enrollment.Status == EnrollmentStatus.Pending)
                {
                    throw new ValidationException("Cannot accept payments for a pending enrollment. Confirm the enrollment first.");
                }

                if (enrollment.Status == EnrollmentStatus.Cancelled)
                {
                    throw new ValidationException("Cannot accept payments for a cancelled enrollment.");
                }

                // 3. Accounting and Balance Verification
                var effectivePaid = await _paymentRepository.GetEffectivePaidAmountAsync(enrollment.Id, null, cancellationToken);
                var remainingAmount = Math.Max(enrollment.TuitionAmount - effectivePaid, 0m);

                if (remainingAmount == 0)
                {
                    throw new ValidationException("Enrollment is already fully paid.");
                }

                if (request.Amount.Value > remainingAmount)
                {
                    throw new ValidationException("Payment amount exceeds remaining tuition balance.");
                }

                // 4. Construct and Save Entity (strictly Pending)
                var payment = new Payment
                {
                    EnrollmentId = enrollment.Id,
                    Amount = request.Amount.Value,
                    PaymentDate = request.PaymentDate ?? DateTime.UtcNow,
                    PaymentMethod = request.PaymentMethod.Value,
                    TransactionCode = transactionCode,
                    Status = PaymentStatus.Pending,
                    Note = note
                };

                await _paymentRepository.AddAsync(payment, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _paymentRepository.GetDetailByIdAsync(payment.Id, cancellationToken))!;
            }
            catch (DbUpdateException dbEx) when (IsUniqueConstraintViolation(dbEx))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Transaction code already exists.");
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on payment creation (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for payment creation due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    public async Task<PaymentDetailResponse> UpdateAsync(int id, UpdatePaymentRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.Amount.HasValue &&
            !request.PaymentDate.HasValue &&
            !request.PaymentMethod.HasValue &&
            request.TransactionCode == null &&
            request.Note == null)
        {
            throw new ValidationException("At least one field must be provided for update.");
        }

        if (request.Amount.HasValue && request.Amount.Value <= 0)
        {
            throw new ValidationException("Amount must be greater than 0.");
        }

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
                if (payment == null)
                {
                    throw new NotFoundException($"Payment with ID {id} not found.");
                }

                var hasEffectiveChange = false;

                if (payment.Status == PaymentStatus.Completed ||
                    payment.Status == PaymentStatus.Failed ||
                    payment.Status == PaymentStatus.Cancelled)
                {
                    if (request.Amount.HasValue ||
                        request.PaymentDate.HasValue ||
                        request.PaymentMethod.HasValue ||
                        request.TransactionCode != null)
                    {
                        throw new ValidationException($"Payment in status {payment.Status} cannot modify financial fields. Only Note can be updated.");
                    }

                    if (request.Note != null)
                    {
                        var newNote = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
                        if (payment.Note != newNote)
                        {
                            payment.Note = newNote;
                            hasEffectiveChange = true;
                        }
                    }
                }
                else if (payment.Status == PaymentStatus.Pending)
                {
                    if (request.Amount.HasValue)
                    {
                        if (payment.Amount != request.Amount.Value)
                        {
                            var effectivePaid = await _paymentRepository.GetEffectivePaidAmountAsync(payment.EnrollmentId, payment.Id, cancellationToken);
                            var remainingAmount = Math.Max(payment.Enrollment.TuitionAmount - effectivePaid, 0m);

                            if (remainingAmount == 0)
                            {
                                throw new ValidationException("Enrollment is already fully paid.");
                            }

                            if (request.Amount.Value > remainingAmount)
                            {
                                throw new ValidationException("Payment amount exceeds remaining tuition balance.");
                            }

                            payment.Amount = request.Amount.Value;
                            hasEffectiveChange = true;
                        }
                    }

                    if (request.PaymentDate.HasValue && payment.PaymentDate != request.PaymentDate.Value)
                    {
                        payment.PaymentDate = request.PaymentDate.Value;
                        hasEffectiveChange = true;
                    }

                    if (request.PaymentMethod.HasValue && payment.PaymentMethod != request.PaymentMethod.Value)
                    {
                        payment.PaymentMethod = request.PaymentMethod.Value;
                        hasEffectiveChange = true;
                    }

                    if (request.TransactionCode != null)
                    {
                        var newCode = string.IsNullOrWhiteSpace(request.TransactionCode) ? null : request.TransactionCode.Trim();
                        if (payment.TransactionCode != newCode)
                        {
                            if (newCode != null)
                            {
                                var codeExists = await _paymentRepository.ExistsByTransactionCodeAsync(newCode, payment.Id, cancellationToken);
                                if (codeExists)
                                {
                                    throw new ConflictException("Transaction code already exists.");
                                }
                            }

                            payment.TransactionCode = newCode;
                            hasEffectiveChange = true;
                        }
                    }

                    if (request.Note != null)
                    {
                        var newNote = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();
                        if (payment.Note != newNote)
                        {
                            payment.Note = newNote;
                            hasEffectiveChange = true;
                        }
                    }
                }

                if (!hasEffectiveChange)
                {
                    throw new ValidationException("No effective changes detected in update request.");
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _paymentRepository.GetDetailByIdAsync(payment.Id, cancellationToken))!;
            }
            catch (DbUpdateException dbEx) when (IsUniqueConstraintViolation(dbEx))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("Transaction code already exists.");
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on payment update (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for payment update due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    public async Task<PaymentDetailResponse> UpdateStatusAsync(int id, UpdatePaymentStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || !request.Status.HasValue)
        {
            throw new ValidationException("Status is required.");
        }

        var targetStatus = request.Status.Value;

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
                if (payment == null)
                {
                    throw new NotFoundException($"Payment with ID {id} not found.");
                }

                if (payment.Status == targetStatus)
                {
                    throw new ValidationException($"Payment is already in status {targetStatus}.");
                }

                if (payment.Status == PaymentStatus.Completed ||
                    payment.Status == PaymentStatus.Failed ||
                    payment.Status == PaymentStatus.Cancelled)
                {
                    throw new ValidationException($"Payment in status {payment.Status} is terminal and cannot transition to {targetStatus}.");
                }

                // Only valid source is Pending
                if (targetStatus != PaymentStatus.Completed &&
                    targetStatus != PaymentStatus.Failed &&
                    targetStatus != PaymentStatus.Cancelled)
                {
                    throw new ValidationException($"Invalid status transition from {payment.Status} to {targetStatus}.");
                }

                if (targetStatus == PaymentStatus.Completed)
                {
                    var enrollment = await _paymentRepository.GetEnrollmentByIdAsync(payment.EnrollmentId, cancellationToken);
                    if (enrollment == null)
                    {
                        throw new NotFoundException($"Enrollment with ID {payment.EnrollmentId} not found.");
                    }

                    if (enrollment.Status == EnrollmentStatus.Pending)
                    {
                        throw new ValidationException("Cannot settle payment for a pending enrollment. Confirm the enrollment first.");
                    }

                    if (enrollment.Status == EnrollmentStatus.Cancelled)
                    {
                        throw new ValidationException("Cannot settle payment for a cancelled enrollment.");
                    }

                    var effectivePaid = await _paymentRepository.GetEffectivePaidAmountAsync(payment.EnrollmentId, payment.Id, cancellationToken);
                    var remainingAmount = Math.Max(enrollment.TuitionAmount - effectivePaid, 0m);

                    if (remainingAmount == 0)
                    {
                        throw new ValidationException("Enrollment is already fully paid.");
                    }

                    if (payment.Amount > remainingAmount)
                    {
                        throw new ValidationException("Payment amount exceeds remaining tuition balance.");
                    }

                    payment.Status = PaymentStatus.Completed;
                    // Option A: Ledger-only. DO NOT automatically mutate Enrollment.Status!
                }
                else
                {
                    payment.Status = targetStatus;
                }

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return (await _paymentRepository.GetDetailByIdAsync(payment.Id, cancellationToken))!;
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on payment status update (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for payment status update due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    public async Task DeleteAsync(int id, CancellationToken cancellationToken = default)
    {
        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                var payment = await _paymentRepository.GetByIdAsync(id, cancellationToken);
                if (payment == null)
                {
                    throw new NotFoundException($"Payment with ID {id} not found.");
                }

                if (payment.Status != PaymentStatus.Pending)
                {
                    throw new ValidationException("Completed or historical financial records cannot be deleted. Only pending payments can be deleted.");
                }

                await _paymentRepository.DeleteAsync(payment, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
                return;
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on payment deletion (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt >= MaxConcurrencyRetries)
            {
                _logger.LogError(ex, "Max retry limit exceeded for payment deletion due to concurrent contention.");
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
            }
        }

        throw new ConflictException("The operation could not be completed due to concurrent access conflicts. Please try again.");
    }

    private static bool IsTransientException(Exception ex)
    {
        if (ex is SqlException sqlEx && (sqlEx.Number == 1205 || sqlEx.Number == 1222))
        {
            return true;
        }

        var current = ex.InnerException;
        while (current != null)
        {
            if (current is SqlException innerSqlEx && (innerSqlEx.Number == 1205 || innerSqlEx.Number == 1222))
            {
                return true;
            }
            current = current.InnerException;
        }

        return false;
    }

    private static bool IsUniqueConstraintViolation(DbUpdateException ex)
    {
        var current = ex.InnerException;
        while (current != null)
        {
            if (current is SqlException sqlEx && (sqlEx.Number == 2601 || sqlEx.Number == 2627))
            {
                return true;
            }
            current = current.InnerException;
        }

        return false;
    }
}
