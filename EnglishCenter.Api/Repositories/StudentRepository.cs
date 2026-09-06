using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Students;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class StudentRepository : IStudentRepository
{
    private readonly AppDbContext _context;

    public StudentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<StudentListItemResponse>> GetPagedAsync(StudentQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Students
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across StudentCode, FullName, and Email
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(s =>
                s.StudentCode.Contains(search) ||
                s.User.FullName.Contains(search) ||
                s.User.Email.Contains(search));
        }

        // 2. Filter by Status
        if (query.Status.HasValue)
        {
            queryable = queryable.Where(s => s.Status == query.Status.Value);
        }

        // 3. Filter by CurrentLevel
        if (!string.IsNullOrWhiteSpace(query.CurrentLevel))
        {
            var level = query.CurrentLevel.Trim();
            queryable = queryable.Where(s => s.CurrentLevel == level);
        }

        // 4. Count total matching items
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 5. Apply sorting with whitelist
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(s => s.Id) : queryable.OrderByDescending(s => s.Id),
            "studentcode" => isAscending ? queryable.OrderBy(s => s.StudentCode) : queryable.OrderByDescending(s => s.StudentCode),
            "fullname" => isAscending ? queryable.OrderBy(s => s.User.FullName) : queryable.OrderByDescending(s => s.User.FullName),
            "email" => isAscending ? queryable.OrderBy(s => s.User.Email) : queryable.OrderByDescending(s => s.User.Email),
            "enrollmentdate" => isAscending ? queryable.OrderBy(s => s.EnrollmentDate) : queryable.OrderByDescending(s => s.EnrollmentDate),
            "status" => isAscending ? queryable.OrderBy(s => s.Status) : queryable.OrderByDescending(s => s.Status),
            _ => queryable.OrderByDescending(s => s.Id) // Default sort fallback
        };

        // 6. Pagination & direct projection
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(s => new StudentListItemResponse
            {
                Id = s.Id,
                StudentCode = s.StudentCode,
                FullName = s.User.FullName,
                Email = s.User.Email,
                Phone = s.User.Phone,
                CurrentLevel = s.CurrentLevel,
                EnrollmentDate = s.EnrollmentDate,
                Status = s.Status.ToString(),
                IsActive = s.User.IsActive
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<StudentListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<Student?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Students.FindAsync(new object[] { id }, cancellationToken);
    }

    public async Task<Student?> GetByIdWithUserAndRolesAsync(int id, bool asNoTracking = false, CancellationToken cancellationToken = default)
    {
        var queryable = asNoTracking
            ? _context.Students.AsNoTracking()
            : _context.Students.AsQueryable();

        return await queryable
            .Include(s => s.User)
            .ThenInclude(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(s => s.Id == id, cancellationToken);
    }

    public async Task<bool> StudentCodeExistsAsync(string studentCode, CancellationToken cancellationToken = default)
    {
        var trimmed = studentCode.Trim();
        return await _context.Students
            .AnyAsync(s => s.StudentCode == trimmed, cancellationToken);
    }

    public async Task AddAsync(Student student, CancellationToken cancellationToken = default)
    {
        await _context.Students.AddAsync(student, cancellationToken);
    }

    public async Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        await _context.SaveChangesAsync(cancellationToken);
    }
}
