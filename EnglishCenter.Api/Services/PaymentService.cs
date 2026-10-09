using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Configuration;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Payments;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Services.Interfaces;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace EnglishCenter.Api.Services;

public class PaymentService : IPaymentService
{
    private const int MaxConcurrencyRetries = 2;

    private readonly AppDbContext _context;
    private readonly IPaymentRepository _paymentRepository;
    private readonly SePayOptions _sePayOptions;
    private readonly ILogger<PaymentService> _logger;

    public PaymentService(
        AppDbContext context,
        IPaymentRepository paymentRepository,
        IOptions<SePayOptions> sePayOptions,
        ILogger<PaymentService> logger)
    {
        _context = context;
        _paymentRepository = paymentRepository;
        _sePayOptions = sePayOptions.Value;
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
                    CreatedAt = DateTime.UtcNow,
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
                    payment.Status == PaymentStatus.Paid ||
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
                    payment.Status == PaymentStatus.Paid ||
                    payment.Status == PaymentStatus.Failed ||
                    payment.Status == PaymentStatus.Cancelled)
                {
                    throw new ValidationException($"Payment in status {payment.Status} is terminal and cannot transition to {targetStatus}.");
                }

                // Only valid source is Pending
                if (targetStatus != PaymentStatus.Completed &&
                    targetStatus != PaymentStatus.Paid &&
                    targetStatus != PaymentStatus.Failed &&
                    targetStatus != PaymentStatus.Cancelled)
                {
                    throw new ValidationException($"Invalid status transition from {payment.Status} to {targetStatus}.");
                }

                if (targetStatus == PaymentStatus.Completed || targetStatus == PaymentStatus.Paid)
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

                    payment.Status = targetStatus;
                    payment.PaidAt ??= DateTime.UtcNow;
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

    // =========================================================================
    // SePay VietQR Student Methods
    // =========================================================================

    public async Task<SePayPaymentResponse> GetOrCreateStudentSePayPaymentAsync(int enrollmentId, int currentUserId, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == currentUserId, cancellationToken);

        if (student == null)
        {
            throw new ForbiddenException("Only registered students can initiate tuition payment.");
        }

        var enrollment = await _paymentRepository.GetEnrollmentWithStudentAsync(enrollmentId, cancellationToken);
        if (enrollment == null)
        {
            throw new NotFoundException($"Enrollment with ID {enrollmentId} not found.");
        }

        // BOLA Enforcement (Section 39)
        if (enrollment.StudentId != student.Id)
        {
            throw new ForbiddenException("You are not authorized to view or pay for another student's enrollment.");
        }

        if (enrollment.Status == EnrollmentStatus.Cancelled)
        {
            throw new ValidationException("Cannot pay tuition for a cancelled enrollment.");
        }

        // Calculate authoritative server-side remaining tuition amount (Section 14)
        var effectivePaid = await _paymentRepository.GetEffectivePaidAmountAsync(enrollment.Id, null, cancellationToken);
        var remainingAmount = Math.Max(enrollment.TuitionAmount - effectivePaid, 0m);

        if (remainingAmount <= 0)
        {
            throw new ValidationException("This enrollment tuition is already fully paid.");
        }

        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                // Check if there is an existing pending SePay payment to reuse (Section 12)
                var existingPending = await _paymentRepository.GetPendingSePayPaymentForEnrollmentAsync(enrollment.Id, cancellationToken);
                Payment paymentToUse;

                if (existingPending != null && !string.IsNullOrWhiteSpace(existingPending.PaymentCode))
                {
                    if (existingPending.Amount != remainingAmount)
                    {
                        existingPending.Amount = remainingAmount;
                        await _context.SaveChangesAsync(cancellationToken);
                    }
                    paymentToUse = existingPending;
                }
                else
                {
                    var paymentCode = await GenerateUniquePaymentCodeAsync(cancellationToken);
                    paymentToUse = new Payment
                    {
                        EnrollmentId = enrollment.Id,
                        Amount = remainingAmount,
                        PaymentDate = DateTime.UtcNow,
                        CreatedAt = DateTime.UtcNow,
                        PaymentMethod = PaymentMethod.SePay,
                        PaymentCode = paymentCode,
                        Status = PaymentStatus.Pending,
                        Note = $"Học phí {enrollment.Course.CourseName} - VietQR ({paymentCode})"
                    };

                    await _paymentRepository.AddAsync(paymentToUse, cancellationToken);
                    await _context.SaveChangesAsync(cancellationToken);
                }

                await transaction.CommitAsync(cancellationToken);

                var qrUrl = BuildVietQrUrl(paymentToUse.Amount, paymentToUse.PaymentCode!);

                return new SePayPaymentResponse
                {
                    PaymentId = paymentToUse.Id,
                    EnrollmentId = enrollment.Id,
                    PaymentCode = paymentToUse.PaymentCode!,
                    Amount = paymentToUse.Amount,
                    BankName = _sePayOptions.BankCode,
                    AccountNumber = _sePayOptions.BankAccount,
                    AccountHolder = _sePayOptions.AccountHolder,
                    QrUrl = qrUrl,
                    Status = paymentToUse.Status.ToString(),
                    CreatedAt = paymentToUse.CreatedAt,
                    PaidAt = paymentToUse.PaidAt,
                    CourseName = enrollment.Course.CourseName,
                    ClassCode = enrollment.ClassStudent?.Class?.ClassCode,
                    StudentName = enrollment.Student.User.FullName,
                    StudentCode = enrollment.Student.StudentCode
                };
            }
            catch (DbUpdateException dbEx) when (IsUniqueConstraintViolation(dbEx))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                if (attempt >= MaxConcurrencyRetries) throw;
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
        }

        throw new ConflictException("Could not create payment due to concurrency contention. Please try again.");
    }

    public async Task<SePayPaymentResponse> GetStudentSePayPaymentAsync(int enrollmentId, int currentUserId, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == currentUserId, cancellationToken);

        if (student == null)
        {
            throw new ForbiddenException("Only registered students can view tuition payments.");
        }

        var enrollment = await _paymentRepository.GetEnrollmentWithStudentAsync(enrollmentId, cancellationToken);
        if (enrollment == null)
        {
            throw new NotFoundException($"Enrollment with ID {enrollmentId} not found.");
        }

        if (enrollment.StudentId != student.Id)
        {
            throw new ForbiddenException("You are not authorized to view another student's enrollment payment.");
        }

        var payment = await _context.Payments
            .Where(p => p.EnrollmentId == enrollmentId && p.PaymentMethod == PaymentMethod.SePay)
            .OrderByDescending(p => p.Id)
            .FirstOrDefaultAsync(cancellationToken);

        if (payment == null || string.IsNullOrWhiteSpace(payment.PaymentCode))
        {
            throw new NotFoundException($"No VietQR payment found for enrollment #{enrollmentId}.");
        }

        var qrUrl = BuildVietQrUrl(payment.Amount, payment.PaymentCode);

        return new SePayPaymentResponse
        {
            PaymentId = payment.Id,
            EnrollmentId = enrollment.Id,
            PaymentCode = payment.PaymentCode,
            Amount = payment.Amount,
            BankName = _sePayOptions.BankCode,
            AccountNumber = _sePayOptions.BankAccount,
            AccountHolder = _sePayOptions.AccountHolder,
            QrUrl = qrUrl,
            Status = payment.Status.ToString(),
            CreatedAt = payment.CreatedAt,
            PaidAt = payment.PaidAt,
            CourseName = enrollment.Course.CourseName,
            ClassCode = enrollment.ClassStudent?.Class?.ClassCode,
            StudentName = enrollment.Student.User.FullName,
            StudentCode = enrollment.Student.StudentCode
        };
    }

    public async Task<List<StudentTuitionEnrollmentResponse>> GetStudentTuitionsAsync(int currentUserId, CancellationToken cancellationToken = default)
    {
        var student = await _context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == currentUserId, cancellationToken);

        if (student == null)
        {
            throw new ForbiddenException("Only registered students can access tuition information.");
        }

        var enrollments = await _paymentRepository.GetStudentEnrollmentsWithDetailsAsync(student.Id, cancellationToken);
        var results = new List<StudentTuitionEnrollmentResponse>();

        foreach (var enrollment in enrollments)
        {
            var effectivePaid = enrollment.Payments
                .Where(p => p.Status == PaymentStatus.Completed || p.Status == PaymentStatus.Paid)
                .Sum(p => p.Amount);

            var remaining = Math.Max(enrollment.TuitionAmount - effectivePaid, 0m);
            var isFullyPaid = remaining == 0;

            var latestSePayPayment = enrollment.Payments
                .Where(p => p.PaymentMethod == PaymentMethod.SePay && !string.IsNullOrWhiteSpace(p.PaymentCode))
                .OrderByDescending(p => p.Id)
                .FirstOrDefault();

            SePayPaymentResponse? activePaymentDto = null;
            if (latestSePayPayment != null && !string.IsNullOrWhiteSpace(latestSePayPayment.PaymentCode))
            {
                activePaymentDto = new SePayPaymentResponse
                {
                    PaymentId = latestSePayPayment.Id,
                    EnrollmentId = enrollment.Id,
                    PaymentCode = latestSePayPayment.PaymentCode,
                    Amount = latestSePayPayment.Amount,
                    BankName = _sePayOptions.BankCode,
                    AccountNumber = _sePayOptions.BankAccount,
                    AccountHolder = _sePayOptions.AccountHolder,
                    QrUrl = BuildVietQrUrl(latestSePayPayment.Amount, latestSePayPayment.PaymentCode),
                    Status = latestSePayPayment.Status.ToString(),
                    CreatedAt = latestSePayPayment.CreatedAt,
                    PaidAt = latestSePayPayment.PaidAt,
                    CourseName = enrollment.Course.CourseName,
                    ClassCode = enrollment.ClassStudent?.Class?.ClassCode,
                    StudentName = student.User?.FullName ?? string.Empty,
                    StudentCode = student.StudentCode
                };
            }

            results.Add(new StudentTuitionEnrollmentResponse
            {
                EnrollmentId = enrollment.Id,
                CourseId = enrollment.CourseId,
                CourseCode = enrollment.Course.CourseCode,
                CourseName = enrollment.Course.CourseName,
                ClassId = enrollment.ClassStudent?.ClassId,
                ClassCode = enrollment.ClassStudent?.Class?.ClassCode,
                TuitionAmount = enrollment.TuitionAmount,
                PaidAmount = effectivePaid,
                RemainingAmount = remaining,
                Status = enrollment.Status,
                IsFullyPaid = isFullyPaid,
                ActivePayment = activePaymentDto
            });
        }

        return results;
    }

    public async Task<PaymentStatusCheckResponse> GetPaymentStatusAsync(int paymentId, int currentUserId, bool isStaffOrAdmin, CancellationToken cancellationToken = default)
    {
        var payment = await _context.Payments
            .Include(p => p.Enrollment)
                .ThenInclude(e => e.Student)
            .FirstOrDefaultAsync(p => p.Id == paymentId, cancellationToken);

        if (payment == null)
        {
            throw new NotFoundException($"Payment with ID {paymentId} not found.");
        }

        // BOLA Check (Section 38 & 39)
        if (!isStaffOrAdmin)
        {
            if (payment.Enrollment.Student == null || payment.Enrollment.Student.UserId != currentUserId)
            {
                throw new ForbiddenException("You are not authorized to check status of another student's payment.");
            }
        }

        return new PaymentStatusCheckResponse
        {
            PaymentId = payment.Id,
            Status = payment.Status.ToString(),
            PaidAt = payment.PaidAt,
            Amount = payment.Amount,
            PaymentCode = payment.PaymentCode
        };
    }

    // =========================================================================
    // SePay Webhook Processing (Idempotent, Transactional, Verified)
    // =========================================================================

    public async Task<bool> ProcessSePayWebhookAsync(SePayWebhookPayload payload, CancellationToken cancellationToken = default)
    {
        if (payload == null)
        {
            throw new ValidationException("Payload cannot be null.");
        }

        // Section 21: Incoming transaction only
        if (!string.Equals(payload.TransferType?.Trim(), "in", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation("Ignoring non-incoming transaction (Tx: {TxId}, Type: {Type}).", payload.Id, payload.TransferType);
            return true;
        }

        // Section 22: Receiving account validation
        var configuredAccount = _sePayOptions.BankAccount?.Trim();
        var receivedAccount = payload.AccountNumber?.Trim();
        if (!string.Equals(configuredAccount, receivedAccount, StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Receiving account mismatch: configured '{Configured}', received '{Received}' (Tx: {TxId}).",
                configuredAccount, receivedAccount, payload.Id);
            return true; // Acknowledged safely, payment NOT marked Paid
        }

        // Section 23: Payment code match
        var paymentCode = ExtractPaymentCode(payload.Code, payload.Content);
        if (string.IsNullOrWhiteSpace(paymentCode))
        {
            _logger.LogInformation("No recognized payment code found in transaction {TxId} (Code: '{Code}', Content: '{Content}').",
                payload.Id, payload.Code, payload.Content);
            return true; // Acknowledged safely, no payment matched
        }

        // Section 28: Transactional update
        for (int attempt = 0; attempt <= MaxConcurrencyRetries; attempt++)
        {
            await using var transaction = await _context.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
            try
            {
                // Section 26 & 27: Idempotency check via SePayTransactionId
                var existingTxPayment = await _paymentRepository.GetBySePayTransactionIdAsync(payload.Id, cancellationToken);
                if (existingTxPayment != null)
                {
                    _logger.LogInformation("Idempotent webhook delivery: Transaction {TxId} was already processed for payment {PaymentId}.",
                        payload.Id, existingTxPayment.Id);
                    await transaction.CommitAsync(cancellationToken);
                    return true;
                }

                // Section 28 & 30: Find Payment by PaymentCode
                var payment = await _paymentRepository.GetByPaymentCodeAsync(paymentCode, cancellationToken);
                if (payment == null)
                {
                    // Section 30: Unknown payment code -> do NOT create payment automatically
                    _logger.LogWarning("Payment not found for PaymentCode '{Code}' (Tx: {TxId}). Safe reconciliation recorded.",
                        paymentCode, payload.Id);
                    await transaction.CommitAsync(cancellationToken);
                    return true;
                }

                // Section 29: Already Paid Payment
                if (payment.Status == PaymentStatus.Paid || payment.Status == PaymentStatus.Completed)
                {
                    if (payment.SePayTransactionId == payload.Id)
                    {
                        _logger.LogInformation("Idempotent replay: Payment {PaymentId} already Paid with transaction {TxId}.",
                            payment.Id, payload.Id);
                        await transaction.CommitAsync(cancellationToken);
                        return true;
                    }

                    _logger.LogWarning("Payment {PaymentId} is already paid. Different transaction {TxId} received. Preserving existing transaction identity.",
                        payment.Id, payload.Id);
                    await transaction.CommitAsync(cancellationToken);
                    return true;
                }

                // Verify status is Pending
                if (payment.Status != PaymentStatus.Pending)
                {
                    _logger.LogWarning("Payment {PaymentId} is in {Status} state. Cannot mark Paid from webhook.", payment.Id, payment.Status);
                    await transaction.CommitAsync(cancellationToken);
                    return true;
                }

                // Section 24 & 25: Amount Verification
                if (payload.TransferAmount != payment.Amount)
                {
                    _logger.LogWarning("Amount mismatch for Payment {PaymentId} (Code: {Code}): expected {Expected}, received {Received}. Keeping Pending.",
                        payment.Id, payment.PaymentCode, payment.Amount, payload.TransferAmount);

                    payment.ReceivedAmount = payload.TransferAmount;
                    payment.WebhookReceivedAt = DateTime.UtcNow;
                    payment.Note = string.IsNullOrWhiteSpace(payment.Note)
                        ? $"Mismatch amount: expected {payment.Amount}, received {payload.TransferAmount}"
                        : $"{payment.Note} | Mismatch: expected {payment.Amount}, received {payload.TransferAmount}";

                    await _context.SaveChangesAsync(cancellationToken);
                    await transaction.CommitAsync(cancellationToken);
                    return true;
                }

                // Exact match! Atomically update to Paid (Section 28)
                payment.ReceivedAmount = payload.TransferAmount;
                payment.SePayTransactionId = payload.Id;
                payment.SePayReferenceCode = payload.ReferenceCode;
                payment.PaidAt = DateTime.UtcNow;
                payment.WebhookReceivedAt = DateTime.UtcNow;
                payment.Status = PaymentStatus.Paid;
                payment.TransactionCode = payload.ReferenceCode ?? payload.Id.ToString();
                payment.Note = string.IsNullOrWhiteSpace(payment.Note)
                    ? $"Thanh toán thành công qua SePay VietQR (Mã GD SePay: {payload.Id})"
                    : $"{payment.Note} | SePay Tx: {payload.Id}";

                await _context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                _logger.LogInformation("Payment {PaymentId} (Code: {Code}, Amount: {Amount}) successfully marked Paid with SePay Tx {TxId}.",
                    payment.Id, payment.PaymentCode, payment.Amount, payload.Id);

                return true;
            }
            catch (DbUpdateException dbEx) when (IsUniqueConstraintViolation(dbEx))
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogWarning("Unique constraint violation during webhook processing for Tx {TxId}. Handled as idempotent duplicate.", payload.Id);
                return true;
            }
            catch (Exception ex) when (IsTransientException(ex) && attempt < MaxConcurrencyRetries)
            {
                _logger.LogWarning(ex, "Transient concurrency contention on webhook processing (attempt {Attempt}). Retrying...", attempt + 1);
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                await Task.Delay(50 * (attempt + 1), cancellationToken);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync(cancellationToken);
                _context.ChangeTracker.Clear();
                _logger.LogError(ex, "Error processing SePay webhook for transaction {TxId}.", payload.Id);
                throw;
            }
        }

        throw new ConflictException("Could not complete webhook processing due to concurrent contention.");
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private async Task<string> GenerateUniquePaymentCodeAsync(CancellationToken cancellationToken)
    {
        const string chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
        var prefix = string.IsNullOrWhiteSpace(_sePayOptions.PaymentPrefix) ? "EC" : _sePayOptions.PaymentPrefix.Trim().ToUpperInvariant();

        for (int attempt = 0; attempt < 10; attempt++)
        {
            var randomBytes = new byte[6];
            RandomNumberGenerator.Fill(randomBytes);
            var sb = new StringBuilder(prefix);
            for (int i = 0; i < 6; i++)
            {
                sb.Append(chars[randomBytes[i] % chars.Length]);
            }
            var candidateCode = sb.ToString();

            var exists = await _paymentRepository.ExistsByPaymentCodeAsync(candidateCode, null, cancellationToken);
            if (!exists)
            {
                return candidateCode;
            }
        }

        // Fallback with Guid suffix
        var guidSuffix = Guid.NewGuid().ToString("N")[..6].ToUpperInvariant();
        return $"{prefix}{guidSuffix}";
    }

    private string? ExtractPaymentCode(string? code, string? content)
    {
        var prefix = string.IsNullOrWhiteSpace(_sePayOptions.PaymentPrefix) ? "EC" : _sePayOptions.PaymentPrefix.Trim().ToUpperInvariant();

        // 1. Direct code provided by SePay
        if (!string.IsNullOrWhiteSpace(code))
        {
            var trimmedCode = code.Trim().ToUpperInvariant();
            if (Regex.IsMatch(trimmedCode, $"^{Regex.Escape(prefix)}[A-Z0-9]{{6,12}}$"))
            {
                return trimmedCode;
            }
        }

        // 2. Extract from transfer content
        if (!string.IsNullOrWhiteSpace(content))
        {
            var pattern = $@"\b({Regex.Escape(prefix)}[A-Z0-9]{{6,12}})\b";
            var match = Regex.Match(content.ToUpperInvariant(), pattern);
            if (match.Success)
            {
                return match.Groups[1].Value;
            }
        }

        return null;
    }

    private string BuildVietQrUrl(decimal amount, string paymentCode)
    {
        var account = Uri.EscapeDataString(_sePayOptions.BankAccount.Trim());
        var bank = Uri.EscapeDataString(_sePayOptions.BankCode.Trim());
        var longAmount = (long)amount;
        var des = Uri.EscapeDataString(paymentCode.Trim());

        return $"https://vietqr.app/img?acc={account}&bank={bank}&amount={longAmount}&des={des}";
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
