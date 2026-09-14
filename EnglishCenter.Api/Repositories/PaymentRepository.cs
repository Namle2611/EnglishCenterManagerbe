using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Payments;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class PaymentRepository : IPaymentRepository
{
    private readonly AppDbContext _context;

    public PaymentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<PaymentListItemResponse>> GetPagedAsync(PaymentQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Payments
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across StudentCode, StudentName, CourseCode, CourseName, ClassCode, TransactionCode, Note
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(p =>
                p.Enrollment.Student.StudentCode.Contains(search) ||
                p.Enrollment.Student.User.FullName.Contains(search) ||
                p.Enrollment.Course.CourseCode.Contains(search) ||
                p.Enrollment.Course.CourseName.Contains(search) ||
                (p.Enrollment.ClassStudent != null && p.Enrollment.ClassStudent.Class.ClassCode.Contains(search)) ||
                (p.TransactionCode != null && p.TransactionCode.Contains(search)) ||
                (p.Note != null && p.Note.Contains(search)));
        }

        // 2. Exact Filters
        if (query.EnrollmentId.HasValue)
        {
            queryable = queryable.Where(p => p.EnrollmentId == query.EnrollmentId.Value);
        }

        if (query.StudentId.HasValue)
        {
            queryable = queryable.Where(p => p.Enrollment.StudentId == query.StudentId.Value);
        }

        if (query.CourseId.HasValue)
        {
            queryable = queryable.Where(p => p.Enrollment.CourseId == query.CourseId.Value);
        }

        if (query.ClassId.HasValue)
        {
            queryable = queryable.Where(p => p.Enrollment.ClassStudent != null && p.Enrollment.ClassStudent.ClassId == query.ClassId.Value);
        }

        if (query.ParsedStatus.HasValue)
        {
            queryable = queryable.Where(p => p.Status == query.ParsedStatus.Value);
        }

        if (query.ParsedPaymentMethod.HasValue)
        {
            queryable = queryable.Where(p => p.PaymentMethod == query.ParsedPaymentMethod.Value);
        }

        if (query.DateFrom.HasValue)
        {
            queryable = queryable.Where(p => p.PaymentDate >= query.DateFrom.Value);
        }

        if (query.DateTo.HasValue)
        {
            queryable = queryable.Where(p => p.PaymentDate <= query.DateTo.Value);
        }

        if (query.MinAmount.HasValue)
        {
            queryable = queryable.Where(p => p.Amount >= query.MinAmount.Value);
        }

        if (query.MaxAmount.HasValue)
        {
            queryable = queryable.Where(p => p.Amount <= query.MaxAmount.Value);
        }

        // 3. Total Items Count
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 4. Whitelisted Sorting
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(p => p.Id) : queryable.OrderByDescending(p => p.Id),
            "paymentdate" => isAscending ? queryable.OrderBy(p => p.PaymentDate) : queryable.OrderByDescending(p => p.PaymentDate),
            "amount" => isAscending ? queryable.OrderBy(p => p.Amount) : queryable.OrderByDescending(p => p.Amount),
            "status" => isAscending ? queryable.OrderBy(p => p.Status) : queryable.OrderByDescending(p => p.Status),
            "paymentmethod" => isAscending ? queryable.OrderBy(p => p.PaymentMethod) : queryable.OrderByDescending(p => p.PaymentMethod),
            "studentcode" => isAscending ? queryable.OrderBy(p => p.Enrollment.Student.StudentCode) : queryable.OrderByDescending(p => p.Enrollment.Student.StudentCode),
            "studentname" => isAscending ? queryable.OrderBy(p => p.Enrollment.Student.User.FullName) : queryable.OrderByDescending(p => p.Enrollment.Student.User.FullName),
            "coursename" => isAscending ? queryable.OrderBy(p => p.Enrollment.Course.CourseName) : queryable.OrderByDescending(p => p.Enrollment.Course.CourseName),
            "transactioncode" => isAscending ? queryable.OrderBy(p => p.TransactionCode) : queryable.OrderByDescending(p => p.TransactionCode),
            _ => queryable.OrderByDescending(p => p.PaymentDate).ThenByDescending(p => p.Id)
        };

        // 5. Pagination
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(p => new PaymentListItemResponse
            {
                Id = p.Id,
                EnrollmentId = p.EnrollmentId,
                StudentId = p.Enrollment.StudentId,
                StudentCode = p.Enrollment.Student.StudentCode,
                StudentName = p.Enrollment.Student.User.FullName,
                CourseId = p.Enrollment.CourseId,
                CourseCode = p.Enrollment.Course.CourseCode,
                CourseName = p.Enrollment.Course.CourseName,
                ClassId = p.Enrollment.ClassStudent != null ? p.Enrollment.ClassStudent.ClassId : (int?)null,
                ClassCode = p.Enrollment.ClassStudent != null ? p.Enrollment.ClassStudent.Class.ClassCode : null,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                TransactionCode = p.TransactionCode,
                Status = p.Status,
                Note = p.Note
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<PaymentListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<PaymentDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Payments
            .AsNoTracking()
            .Where(p => p.Id == id)
            .Select(p => new PaymentDetailResponse
            {
                Id = p.Id,
                EnrollmentId = p.EnrollmentId,
                StudentId = p.Enrollment.StudentId,
                StudentCode = p.Enrollment.Student.StudentCode,
                StudentName = p.Enrollment.Student.User.FullName,
                StudentEmail = p.Enrollment.Student.User.Email,
                CourseId = p.Enrollment.CourseId,
                CourseCode = p.Enrollment.Course.CourseCode,
                CourseName = p.Enrollment.Course.CourseName,
                ClassId = p.Enrollment.ClassStudent != null ? p.Enrollment.ClassStudent.ClassId : (int?)null,
                ClassCode = p.Enrollment.ClassStudent != null ? p.Enrollment.ClassStudent.Class.ClassCode : null,
                TuitionAmount = p.Enrollment.TuitionAmount,
                Amount = p.Amount,
                PaymentDate = p.PaymentDate,
                PaymentMethod = p.PaymentMethod,
                TransactionCode = p.TransactionCode,
                Status = p.Status,
                Note = p.Note
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Payment?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Payments
            .Include(p => p.Enrollment)
            .FirstOrDefaultAsync(p => p.Id == id, cancellationToken);
    }

    public async Task<Enrollment?> GetEnrollmentByIdAsync(int enrollmentId, CancellationToken cancellationToken = default)
    {
        return await _context.Enrollments
            .FirstOrDefaultAsync(e => e.Id == enrollmentId, cancellationToken);
    }

    public async Task<decimal> GetEffectivePaidAmountAsync(int enrollmentId, int? excludePaymentId = null, CancellationToken cancellationToken = default)
    {
        return await _context.Payments
            .Where(p => p.EnrollmentId == enrollmentId &&
                        p.Status == PaymentStatus.Completed &&
                        (!excludePaymentId.HasValue || p.Id != excludePaymentId.Value))
            .SumAsync(p => (decimal?)p.Amount, cancellationToken) ?? 0m;
    }

    public async Task<PaymentSummaryResponse?> GetPaymentSummaryAsync(int enrollmentId, CancellationToken cancellationToken = default)
    {
        var enrollment = await _context.Enrollments
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.Id == enrollmentId, cancellationToken);

        if (enrollment == null)
        {
            return null;
        }

        var payments = await _context.Payments
            .AsNoTracking()
            .Where(p => p.EnrollmentId == enrollmentId)
            .ToListAsync(cancellationToken);

        var effectivePaid = payments
            .Where(p => p.Status == PaymentStatus.Completed)
            .Sum(p => p.Amount);

        var pendingPaid = payments
            .Where(p => p.Status == PaymentStatus.Pending)
            .Sum(p => p.Amount);

        var remaining = Math.Max(enrollment.TuitionAmount - effectivePaid, 0m);
        var isFullyPaid = effectivePaid >= enrollment.TuitionAmount;

        return new PaymentSummaryResponse
        {
            EnrollmentId = enrollment.Id,
            TuitionAmount = enrollment.TuitionAmount,
            EffectivePaidAmount = effectivePaid,
            PendingPaidAmount = pendingPaid,
            RemainingAmount = remaining,
            IsFullyPaid = isFullyPaid,
            CompletedPaymentCount = payments.Count(p => p.Status == PaymentStatus.Completed),
            TotalPaymentCount = payments.Count,
            EnrollmentStatus = enrollment.Status
        };
    }

    public async Task<bool> ExistsByTransactionCodeAsync(string transactionCode, int? excludePaymentId = null, CancellationToken cancellationToken = default)
    {
        return await _context.Payments
            .AnyAsync(p => p.TransactionCode == transactionCode &&
                           (!excludePaymentId.HasValue || p.Id != excludePaymentId.Value),
                      cancellationToken);
    }

    public async Task AddAsync(Payment payment, CancellationToken cancellationToken = default)
    {
        await _context.Payments.AddAsync(payment, cancellationToken);
    }

    public Task DeleteAsync(Payment payment, CancellationToken cancellationToken = default)
    {
        _context.Payments.Remove(payment);
        return Task.CompletedTask;
    }
}
