using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Registration;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class RegistrationRequestRepository : IRegistrationRequestRepository
{
    private readonly AppDbContext _context;

    public RegistrationRequestRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<AccountRegistrationRequest?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.AccountRegistrationRequests
            .Include(r => r.ReviewedByUser)
            .FirstOrDefaultAsync(r => r.Id == id, cancellationToken);
    }

    public async Task<AccountRegistrationRequest?> GetPendingByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
    {
        return await _context.AccountRegistrationRequests
            .FirstOrDefaultAsync(r => r.NormalizedEmail == normalizedEmail && r.Status == RegistrationStatus.PendingEmailVerification, cancellationToken);
    }

    public async Task<AccountRegistrationRequest?> GetActiveByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default)
    {
        // Active means not completed
        return await _context.AccountRegistrationRequests
            .OrderByDescending(r => r.CreatedAt)
            .FirstOrDefaultAsync(r => r.NormalizedEmail == normalizedEmail, cancellationToken);
    }

    public async Task<PagedResult<RegistrationRequestDto>> GetPagedAsync(RegistrationRequestQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.AccountRegistrationRequests
            .AsNoTracking()
            .Include(r => r.ReviewedByUser)
            .AsQueryable();

        // 1. Status filter (default to PendingApproval if not provided, or filter if provided)
        if (query.Status.HasValue)
        {
            queryable = queryable.Where(r => r.Status == query.Status.Value);
        }

        // 2. Role filter
        if (!string.IsNullOrWhiteSpace(query.Role))
        {
            var role = query.Role.Trim().ToUpperInvariant();
            queryable = queryable.Where(r => r.RequestedRole == role);
        }

        // 3. Search
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLowerInvariant();
            queryable = queryable.Where(r =>
                r.FullName.ToLower().Contains(search) ||
                r.Email.ToLower().Contains(search) ||
                (r.Phone != null && r.Phone.Contains(search)));
        }

        var totalItems = await queryable.CountAsync(cancellationToken);

        var page = query.Page <= 0 ? 1 : query.Page;
        var pageSize = query.PageSize <= 0 ? 10 : query.PageSize;

        var items = await queryable
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(r => new RegistrationRequestDto
            {
                Id = r.Id,
                Email = r.Email,
                FullName = r.FullName,
                Phone = r.Phone,
                RequestedRole = r.RequestedRole,
                Status = r.Status,
                EmailVerifiedAt = r.EmailVerifiedAt,
                Specialization = r.Specialization,
                Qualification = r.Qualification,
                ExperienceYears = r.ExperienceYears,
                DateOfBirth = r.DateOfBirth,
                Gender = r.Gender,
                Address = r.Address,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                ReviewedByUserId = r.ReviewedByUserId,
                ReviewedByAdminName = r.ReviewedByUser != null ? r.ReviewedByUser.FullName : null,
                ReviewedAt = r.ReviewedAt,
                RejectionReason = r.RejectionReason
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<RegistrationRequestDto>(items, totalItems, page, pageSize);
    }

    public async Task AddAsync(AccountRegistrationRequest entity, CancellationToken cancellationToken = default)
    {
        await _context.AccountRegistrationRequests.AddAsync(entity, cancellationToken);
    }

    public Task UpdateAsync(AccountRegistrationRequest entity, CancellationToken cancellationToken = default)
    {
        _context.AccountRegistrationRequests.Update(entity);
        return Task.CompletedTask;
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
