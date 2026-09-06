using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Students;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class StudentService : IStudentService
{
    private readonly AppDbContext _context;
    private readonly IStudentRepository _studentRepository;
    private readonly IUserAccountService _userAccountService;
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILogger<StudentService> _logger;

    public StudentService(
        AppDbContext context,
        IStudentRepository studentRepository,
        IUserAccountService userAccountService,
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ILogger<StudentService> logger)
    {
        _context = context;
        _studentRepository = studentRepository;
        _userAccountService = userAccountService;
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _logger = logger;
    }

    public async Task<PagedResult<StudentListItemResponse>> GetListAsync(StudentQuery query, CancellationToken cancellationToken = default)
    {
        return await _studentRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<StudentDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var student = await _studentRepository.GetByIdWithUserAndRolesAsync(id, asNoTracking: true, cancellationToken);
        if (student == null)
        {
            throw new NotFoundException($"Student with ID {id} not found.");
        }

        return MapToDetailResponse(student);
    }

    public async Task<StudentDetailResponse> CreateAsync(CreateStudentRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (request.DateOfBirth.HasValue && request.DateOfBirth.Value.Date > DateTime.UtcNow.Date)
        {
            throw new ValidationException("Date of birth cannot be in the future.");
        }

        var trimmedStudentCode = request.StudentCode.Trim();

        // 1. Application-level check for StudentCode uniqueness
        var codeExists = await _studentRepository.StudentCodeExistsAsync(trimmedStudentCode, cancellationToken);
        if (codeExists)
        {
            throw new ConflictException("Student code already exists.");
        }

        // 2. Open outer transaction for atomic creation
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Create user account via foundation service (validates email uniqueness, hashes password, assigns STUDENT role)
            var accountCommand = new CreateUserAccountCommand
            {
                Email = request.Email,
                Password = request.Password,
                FullName = request.FullName,
                Phone = request.Phone,
                RoleName = RoleNames.Student,
                IsActive = true
            };

            var user = await _userAccountService.CreateUserAccountAsync(accountCommand, cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
            {
                user.AvatarUrl = request.AvatarUrl.Trim();
            }

            // Create Student entity
            var student = new Student
            {
                UserId = user.Id,
                StudentCode = trimmedStudentCode,
                DateOfBirth = request.DateOfBirth,
                Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim(),
                Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim(),
                CurrentLevel = string.IsNullOrWhiteSpace(request.CurrentLevel) ? null : request.CurrentLevel.Trim(),
                EnrollmentDate = DateTime.UtcNow,
                Status = StudentStatus.Active,
                User = user
            };

            await _studentRepository.AddAsync(student, cancellationToken);
            await _studentRepository.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Successfully created Student {StudentId} with code {StudentCode}", student.Id, student.StudentCode);

            return MapToDetailResponse(student, [RoleNames.Student]);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<StudentDetailResponse> UpdateAsync(int id, UpdateStudentRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (request.DateOfBirth.HasValue && request.DateOfBirth.Value.Date > DateTime.UtcNow.Date)
        {
            throw new ValidationException("Date of birth cannot be in the future.");
        }

        var student = await _studentRepository.GetByIdWithUserAndRolesAsync(id, asNoTracking: false, cancellationToken);
        if (student == null)
        {
            throw new NotFoundException($"Student with ID {id} not found.");
        }

        var trimmedEmail = request.Email.Trim();

        // Check if email is already in use by another user (excludes current user)
        var emailConflict = await _userRepository.EmailExistsExceptUserAsync(trimmedEmail, student.UserId, cancellationToken);
        if (emailConflict)
        {
            throw new ConflictException("Email is already in use.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Update User fields
            student.User.Email = trimmedEmail;
            student.User.FullName = request.FullName.Trim();
            student.User.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
            student.User.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
            student.User.UpdatedAt = DateTime.UtcNow;

            // Update Student fields (StudentCode, EnrollmentDate, Status are immutable here)
            student.DateOfBirth = request.DateOfBirth;
            student.Gender = string.IsNullOrWhiteSpace(request.Gender) ? null : request.Gender.Trim();
            student.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
            student.CurrentLevel = string.IsNullOrWhiteSpace(request.CurrentLevel) ? null : request.CurrentLevel.Trim();

            await _studentRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Successfully updated Student {StudentId}", student.Id);

            return MapToDetailResponse(student);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<StudentDetailResponse> UpdateStatusAsync(int id, UpdateStudentStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (!Enum.IsDefined(typeof(StudentStatus), request.Status))
        {
            throw new ValidationException("Invalid student status value.");
        }

        var student = await _studentRepository.GetByIdWithUserAndRolesAsync(id, asNoTracking: false, cancellationToken);
        if (student == null)
        {
            throw new NotFoundException($"Student with ID {id} not found.");
        }

        // Idempotent: if target status is already current status, return without modification
        if (student.Status == request.Status)
        {
            return MapToDetailResponse(student);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            student.Status = request.Status;

            switch (request.Status)
            {
                case StudentStatus.Active:
                case StudentStatus.Graduated:
                    student.User.IsActive = true;
                    break;

                case StudentStatus.Inactive:
                case StudentStatus.Suspended:
                    student.User.IsActive = false;
                    // Revoke all active refresh tokens when student is disabled
                    await _refreshTokenRepository.RevokeAllForUserAsync(student.UserId);
                    break;
            }

            student.User.UpdatedAt = DateTime.UtcNow;

            await _studentRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Updated Student {StudentId} status to {Status}, User.IsActive={IsActive}",
                student.Id, student.Status, student.User.IsActive);

            return MapToDetailResponse(student);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static StudentDetailResponse MapToDetailResponse(Student student, IEnumerable<string>? fallbackRoles = null)
    {
        var roles = student.User.UserRoles?
            .Select(ur => ur.Role.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .ToList();

        if ((roles == null || roles.Count == 0) && fallbackRoles != null)
        {
            roles = fallbackRoles.ToList();
        }

        return new StudentDetailResponse
        {
            Id = student.Id,
            StudentCode = student.StudentCode,
            UserId = student.UserId,
            Email = student.User.Email,
            FullName = student.User.FullName,
            Phone = student.User.Phone,
            AvatarUrl = student.User.AvatarUrl,
            IsActive = student.User.IsActive,
            Roles = roles ?? new List<string>(),
            DateOfBirth = student.DateOfBirth,
            Gender = student.Gender,
            Address = student.Address,
            CurrentLevel = student.CurrentLevel,
            EnrollmentDate = student.EnrollmentDate,
            Status = student.Status.ToString()
        };
    }
}
