using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Enrollments;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class EnrollmentRepository : IEnrollmentRepository
{
    private readonly AppDbContext _context;

    public EnrollmentRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PagedResult<EnrollmentListItemResponse>> GetPagedAsync(EnrollmentQuery query, CancellationToken cancellationToken = default)
    {
        var queryable = _context.Enrollments
            .AsNoTracking()
            .AsQueryable();

        // 1. Search across StudentCode, FullName, CourseCode, CourseName, ClassCode
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            queryable = queryable.Where(e =>
                e.Student.StudentCode.Contains(search) ||
                e.Student.User.FullName.Contains(search) ||
                e.Course.CourseCode.Contains(search) ||
                e.Course.CourseName.Contains(search) ||
                (e.ClassStudent != null && e.ClassStudent.Class.ClassCode.Contains(search)));
        }

        // 2. Exact filters
        if (query.StudentId.HasValue)
        {
            queryable = queryable.Where(e => e.StudentId == query.StudentId.Value);
        }

        if (query.CourseId.HasValue)
        {
            queryable = queryable.Where(e => e.CourseId == query.CourseId.Value);
        }

        if (query.ClassId.HasValue)
        {
            queryable = queryable.Where(e => e.ClassStudent != null && e.ClassStudent.ClassId == query.ClassId.Value);
        }

        if (query.ParsedStatus.HasValue)
        {
            queryable = queryable.Where(e => e.Status == query.ParsedStatus.Value);
        }

        if (query.DateFrom.HasValue)
        {
            queryable = queryable.Where(e => e.EnrollmentDate >= query.DateFrom.Value);
        }

        if (query.DateTo.HasValue)
        {
            queryable = queryable.Where(e => e.EnrollmentDate <= query.DateTo.Value);
        }

        // 3. Count
        var totalItems = await queryable.CountAsync(cancellationToken);

        // 4. Whitelisted Sorting
        var isAscending = query.IsAscending;
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();

        queryable = sortBy switch
        {
            "id" => isAscending ? queryable.OrderBy(e => e.Id) : queryable.OrderByDescending(e => e.Id),
            "studentcode" => isAscending ? queryable.OrderBy(e => e.Student.StudentCode) : queryable.OrderByDescending(e => e.Student.StudentCode),
            "studentname" => isAscending ? queryable.OrderBy(e => e.Student.User.FullName) : queryable.OrderByDescending(e => e.Student.User.FullName),
            "coursename" => isAscending ? queryable.OrderBy(e => e.Course.CourseName) : queryable.OrderByDescending(e => e.Course.CourseName),
            "classcode" => isAscending
                ? queryable.OrderBy(e => e.ClassStudent != null ? e.ClassStudent.Class.ClassCode : null)
                : queryable.OrderByDescending(e => e.ClassStudent != null ? e.ClassStudent.Class.ClassCode : null),
            "enrollmentdate" => isAscending ? queryable.OrderBy(e => e.EnrollmentDate) : queryable.OrderByDescending(e => e.EnrollmentDate),
            "tuitionamount" => isAscending ? queryable.OrderBy(e => e.TuitionAmount) : queryable.OrderByDescending(e => e.TuitionAmount),
            "status" => isAscending ? queryable.OrderBy(e => e.Status) : queryable.OrderByDescending(e => e.Status),
            _ => queryable.OrderByDescending(e => e.EnrollmentDate).ThenByDescending(e => e.Id) // Canonical default: newest first
        };

        // 5. Pagination
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize < 1 ? 10 : query.PageSize;

        var items = await queryable
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new EnrollmentListItemResponse
            {
                Id = e.Id,
                StudentId = e.StudentId,
                StudentCode = e.Student.StudentCode,
                StudentName = e.Student.User.FullName,
                CourseId = e.CourseId,
                CourseCode = e.Course.CourseCode,
                CourseName = e.Course.CourseName,
                ClassId = e.ClassStudent != null ? e.ClassStudent.ClassId : (int?)null,
                ClassCode = e.ClassStudent != null ? e.ClassStudent.Class.ClassCode : null,
                TuitionAmount = e.TuitionAmount,
                EnrollmentDate = e.EnrollmentDate,
                Status = e.Status,
                ConfirmedBy = e.ConfirmedBy,
                ConfirmedByName = e.ConfirmedByUser != null ? e.ConfirmedByUser.FullName : null,
                ConfirmedAt = e.ConfirmedAt
            })
            .ToListAsync(cancellationToken);

        return new PagedResult<EnrollmentListItemResponse>(items, totalItems, page, pageSize);
    }

    public async Task<EnrollmentDetailResponse?> GetDetailByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Enrollments
            .AsNoTracking()
            .Where(e => e.Id == id)
            .Select(e => new EnrollmentDetailResponse
            {
                Id = e.Id,
                StudentId = e.StudentId,
                StudentCode = e.Student.StudentCode,
                StudentName = e.Student.User.FullName,
                StudentEmail = e.Student.User.Email,
                StudentPhone = e.Student.User.Phone,
                CourseId = e.CourseId,
                CourseCode = e.Course.CourseCode,
                CourseName = e.Course.CourseName,
                CourseTuitionFee = e.Course.TuitionFee,
                ClassId = e.ClassStudent != null ? e.ClassStudent.ClassId : (int?)null,
                ClassCode = e.ClassStudent != null ? e.ClassStudent.Class.ClassCode : null,
                ClassStatus = e.ClassStudent != null ? e.ClassStudent.Class.Status : (ClassStatus?)null,
                ClassStudentStatus = e.ClassStudent != null ? e.ClassStudent.Status : (ClassStudentStatus?)null,
                ClassJoinedAt = e.ClassStudent != null ? e.ClassStudent.JoinedAt : (DateTime?)null,
                TuitionAmount = e.TuitionAmount,
                EnrollmentDate = e.EnrollmentDate,
                Status = e.Status,
                ConfirmedBy = e.ConfirmedBy,
                ConfirmedByName = e.ConfirmedByUser != null ? e.ConfirmedByUser.FullName : null,
                ConfirmedAt = e.ConfirmedAt
            })
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<Enrollment?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return await _context.Enrollments
            .Include(e => e.ClassStudent)
            .Include(e => e.Student)
            .Include(e => e.Course)
            .FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
    }

    public async Task<Student?> GetStudentByIdAsync(int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.Students
            .Include(s => s.User)
            .FirstOrDefaultAsync(s => s.Id == studentId, cancellationToken);
    }

    public async Task<Course?> GetCourseByIdAsync(int courseId, CancellationToken cancellationToken = default)
    {
        return await _context.Courses
            .FirstOrDefaultAsync(c => c.Id == courseId, cancellationToken);
    }

    public async Task<CourseClass?> GetClassByIdAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.Classes
            .FirstOrDefaultAsync(c => c.Id == classId, cancellationToken);
    }

    public async Task<bool> HasActiveEnrollmentAsync(int studentId, int courseId, int? excludeEnrollmentId = null, CancellationToken cancellationToken = default)
    {
        return await _context.Enrollments
            .AnyAsync(e => e.StudentId == studentId &&
                           e.CourseId == courseId &&
                           e.Status != EnrollmentStatus.Cancelled &&
                           (!excludeEnrollmentId.HasValue || e.Id != excludeEnrollmentId.Value),
                      cancellationToken);
    }

    public async Task<bool> HasClassStudentAsync(int classId, int studentId, CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .AnyAsync(cs => cs.ClassId == classId && cs.StudentId == studentId, cancellationToken);
    }

    public async Task<int> GetActiveClassStudentCountAsync(int classId, CancellationToken cancellationToken = default)
    {
        return await _context.ClassStudents
            .CountAsync(cs => cs.ClassId == classId && cs.Status == ClassStudentStatus.Active, cancellationToken);
    }

    public async Task<bool> HasPaymentsAsync(int enrollmentId, CancellationToken cancellationToken = default)
    {
        return await _context.Payments
            .AnyAsync(p => p.EnrollmentId == enrollmentId, cancellationToken);
    }

    public async Task AddAsync(Enrollment enrollment, CancellationToken cancellationToken = default)
    {
        await _context.Enrollments.AddAsync(enrollment, cancellationToken);
    }

    public Task DeleteAsync(Enrollment enrollment, CancellationToken cancellationToken = default)
    {
        _context.Enrollments.Remove(enrollment);
        return Task.CompletedTask;
    }

    public async Task AddClassStudentAsync(ClassStudent classStudent, CancellationToken cancellationToken = default)
    {
        await _context.ClassStudents.AddAsync(classStudent, cancellationToken);
    }
}
