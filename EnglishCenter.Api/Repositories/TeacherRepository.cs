using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Teachers;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class TeacherRepository : ITeacherRepository
{
    private readonly AppDbContext _context;

    public TeacherRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<TeacherListItemResponse>> GetPagedAsync(TeacherQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Teachers
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across TeacherCode, FullName, and Email
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(t =>
                t.TeacherCode.Contains(search) ||
                t.User.FullName.Contains(search) ||
                t.User.Email.Contains(search));
        }

        // 2. Filter by Status
        if (query.Status.HasValue)
        {
            queryable = queryable.Where(t => t.Status == query.Status.Value);
        }

        // 3. Filter by Specialization
        if (!string.IsNullOrWhiteSpace(query.Specialization))
        {
            var spec = query.Specialization.Trim();
            queryable = queryable.Where(t => t.Specialization == spec);
        }

        // 4. Count total matching items
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 5. Apply sorting with whitelist (normalized to lowercase internally)
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(t => t.Id) : queryable.OrderByDescending(t => t.Id),
            "teachercode" => isAscending ? queryable.OrderBy(t => t.TeacherCode) : queryable.OrderByDescending(t => t.TeacherCode),
            "fullname" => isAscending ? queryable.OrderBy(t => t.User.FullName) : queryable.OrderByDescending(t => t.User.FullName),
            "email" => isAscending ? queryable.OrderBy(t => t.User.Email) : queryable.OrderByDescending(t => t.User.Email),
            "specialization" => isAscending ? queryable.OrderBy(t => t.Specialization) : queryable.OrderByDescending(t => t.Specialization),
            "experienceyears" => isAscending ? queryable.OrderBy(t => t.ExperienceYears) : queryable.OrderByDescending(t => t.ExperienceYears),
            "hiredate" => isAscending ? queryable.OrderBy(t => t.HireDate) : queryable.OrderByDescending(t => t.HireDate),
            "status" => isAscending ? queryable.OrderBy(t => t.Status) : queryable.OrderByDescending(t => t.Status),
            _ => queryable.OrderByDescending(t => t.Id) // Default sort fallback
        };

        // 6. Pagination & direct projection
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new TeacherListItemResponse
            {
                Id = t.Id,
                TeacherCode = t.TeacherCode,
                FullName = t.User.FullName,
                Email = t.User.Email,
                Phone = t.User.Phone,
                Specialization = t.Specialization,
                Qualification = t.Qualification,
                ExperienceYears = t.ExperienceYears,
                HireDate = t.HireDate,
                Status = t.Status.ToString(),
                IsActive = t.User.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<TeacherListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<Teacher?> GetByIdWithUserAndRolesAsync(int id, bool asNoTracking = true, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Teachers.AsQueryable();

        if (asNoTracking)
        {
            queryable = queryable.AsNoTracking();
        }

        return await queryable
            .Include(t => t.User)
                .ThenInclude(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<Teacher?> GetByIdWithUserAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Teachers.AsQueryable();

        if (asNoTracking)
        {
            queryable = queryable.AsNoTracking();
        }

        return await queryable
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
    }

    public async Task<bool> TeacherCodeExistsAsync(string teacherCode, CancellationToken cancellationToken = default)
    {
        var trimmedCode = teacherCode.Trim();
        return await _context.Teachers
            .AnyAsync(t => t.TeacherCode == trimmedCode, cancellationToken);
    }

    public async Task AddAsync(Teacher teacher, CancellationToken cancellationToken = default)
    {
        await _context.Teachers.AddAsync(teacher, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
