using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Teachers;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services;

public class TeacherService : ITeacherService
{
    private readonly AppDbContext _context;
    private readonly ITeacherRepository _teacherRepository;
    private readonly IUserAccountService _userAccountService;
    private readonly IUserRepository _userRepository;
    private readonly IRefreshTokenRepository _refreshTokenRepository;
    private readonly ILogger<TeacherService> _logger;

    public TeacherService(
        AppDbContext context,
        ITeacherRepository teacherRepository,
        IUserAccountService userAccountService,
        IUserRepository userRepository,
        IRefreshTokenRepository refreshTokenRepository,
        ILogger<TeacherService> logger)
    {
        _context = context;
        _teacherRepository = teacherRepository;
        _userAccountService = userAccountService;
        _userRepository = userRepository;
        _refreshTokenRepository = refreshTokenRepository;
        _logger = logger;
    }

    public async Task<PagedResult<TeacherListItemResponse>> GetListAsync(TeacherQuery query, CancellationToken cancellationToken = default)
    {
        return await _teacherRepository.GetPagedAsync(query, cancellationToken);
    }

    public async Task<TeacherDetailResponse> GetDetailAsync(int id, CancellationToken cancellationToken = default)
    {
        var teacher = await _teacherRepository.GetByIdWithUserAndRolesAsync(id, asNoTracking: true, cancellationToken);
        if (teacher == null)
        {
            throw new NotFoundException($"Teacher with ID {id} not found.");
        }

        return MapToDetailResponse(teacher);
    }

    public async Task<TeacherDetailResponse> CreateAsync(CreateTeacherRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.ExperienceYears.HasValue)
        {
            throw new ValidationException("Experience years is required.");
        }

        if (request.ExperienceYears.Value < 0)
        {
            throw new ValidationException("Experience years cannot be negative.");
        }

        if (!request.HireDate.HasValue)
        {
            throw new ValidationException("Hire date is required.");
        }

        if (request.HireDate.Value.Date > DateTime.UtcNow.Date)
        {
            throw new ValidationException("Hire date cannot be in the future.");
        }

        var trimmedTeacherCode = request.TeacherCode.Trim();

        // 1. Application check for TeacherCode uniqueness
        var codeExists = await _teacherRepository.TeacherCodeExistsAsync(trimmedTeacherCode, cancellationToken);
        if (codeExists)
        {
            throw new ConflictException("Teacher code already exists.");
        }

        // 2. Open outer transaction for atomic creation
        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var accountCommand = new CreateUserAccountCommand
            {
                Email = request.Email,
                Password = request.Password,
                FullName = request.FullName,
                Phone = request.Phone,
                RoleName = RoleNames.Teacher,
                IsActive = true
            };

            var user = await _userAccountService.CreateUserAccountAsync(accountCommand, cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.AvatarUrl))
            {
                user.AvatarUrl = request.AvatarUrl.Trim();
            }

            // Create Teacher entity
            var teacher = new Teacher
            {
                UserId = user.Id,
                TeacherCode = trimmedTeacherCode,
                Specialization = request.Specialization.Trim(),
                Qualification = string.IsNullOrWhiteSpace(request.Qualification) ? null : request.Qualification.Trim(),
                ExperienceYears = request.ExperienceYears.Value,
                HireDate = request.HireDate.Value.Date,
                Status = TeacherStatus.Active,
                User = user
            };

            await _teacherRepository.AddAsync(teacher, cancellationToken);
            await _teacherRepository.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Successfully created Teacher {TeacherId} with code {TeacherCode}", teacher.Id, teacher.TeacherCode);

            return MapToDetailResponse(teacher, [RoleNames.Teacher]);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<TeacherDetailResponse> UpdateAsync(int id, UpdateTeacherRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null)
        {
            throw new ValidationException("Request cannot be null.");
        }

        if (!request.ExperienceYears.HasValue)
        {
            throw new ValidationException("Experience years is required.");
        }

        if (request.ExperienceYears.Value < 0)
        {
            throw new ValidationException("Experience years cannot be negative.");
        }

        if (!request.HireDate.HasValue)
        {
            throw new ValidationException("Hire date is required.");
        }

        if (request.HireDate.Value.Date > DateTime.UtcNow.Date)
        {
            throw new ValidationException("Hire date cannot be in the future.");
        }

        var teacher = await _teacherRepository.GetByIdWithUserAsync(id, asNoTracking: false, cancellationToken);
        if (teacher == null)
        {
            throw new NotFoundException($"Teacher with ID {id} not found.");
        }

        var trimmedEmail = request.Email.Trim();

        // Check if email is in use by another user (excluding current teacher's user)
        var emailConflict = await _userRepository.EmailExistsExceptUserAsync(trimmedEmail, teacher.UserId, cancellationToken);
        if (emailConflict)
        {
            throw new ConflictException("Email is already in use.");
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            // Update User fields
            teacher.User.Email = trimmedEmail;
            teacher.User.FullName = request.FullName.Trim();
            teacher.User.Phone = string.IsNullOrWhiteSpace(request.Phone) ? null : request.Phone.Trim();
            teacher.User.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();
            teacher.User.UpdatedAt = DateTime.UtcNow;

            // Update Teacher fields
            teacher.Specialization = request.Specialization.Trim();
            teacher.Qualification = string.IsNullOrWhiteSpace(request.Qualification) ? null : request.Qualification.Trim();
            teacher.ExperienceYears = request.ExperienceYears.Value;
            teacher.HireDate = request.HireDate.Value.Date;

            await _teacherRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Successfully updated Teacher {TeacherId}", teacher.Id);

            return MapToDetailResponse(teacher);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    public async Task<TeacherDetailResponse> UpdateStatusAsync(int id, UpdateTeacherStatusRequest request, CancellationToken cancellationToken = default)
    {
        if (request == null || !request.Status.HasValue)
        {
            throw new ValidationException("Status is required.");
        }

        if (!Enum.IsDefined(typeof(TeacherStatus), request.Status.Value))
        {
            throw new ValidationException("Invalid teacher status value.");
        }

        var teacher = await _teacherRepository.GetByIdWithUserAsync(id, asNoTracking: false, cancellationToken);
        if (teacher == null)
        {
            throw new NotFoundException($"Teacher with ID {id} not found.");
        }

        // Idempotent: return if already target status
        if (teacher.Status == request.Status.Value)
        {
            return MapToDetailResponse(teacher);
        }

        await using var transaction = await _context.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            teacher.Status = request.Status.Value;

            switch (request.Status.Value)
            {
                case TeacherStatus.Active:
                    teacher.User.IsActive = true;
                    break;

                case TeacherStatus.Inactive:
                    teacher.User.IsActive = false;
                    // Revoke all active refresh tokens for the deactivated user in the same Unit of Work
                    await _refreshTokenRepository.RevokeAllForUserAsync(teacher.UserId);
                    break;
            }

            teacher.User.UpdatedAt = DateTime.UtcNow;

            await _teacherRepository.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            _logger.LogInformation("Updated Teacher {TeacherId} status to {Status}, User.IsActive={IsActive}",
                teacher.Id, teacher.Status, teacher.User.IsActive);

            return MapToDetailResponse(teacher);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }

    private static TeacherDetailResponse MapToDetailResponse(Teacher teacher, IEnumerable<string>? fallbackRoles = null)
    {
        var roles = teacher.User.UserRoles?
            .Select(ur => ur.Role.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .ToList();

        if ((roles == null || roles.Count == 0) && fallbackRoles != null)
        {
            roles = fallbackRoles.ToList();
        }

        return new TeacherDetailResponse
        {
            Id = teacher.Id,
            TeacherCode = teacher.TeacherCode,
            UserId = teacher.UserId,
            Email = teacher.User.Email,
            FullName = teacher.User.FullName,
            Phone = teacher.User.Phone,
            AvatarUrl = teacher.User.AvatarUrl,
            IsActive = teacher.User.IsActive,
            Roles = roles ?? new List<string>(),
            Specialization = teacher.Specialization,
            Qualification = teacher.Qualification,
            ExperienceYears = teacher.ExperienceYears,
            HireDate = teacher.HireDate,
            Status = teacher.Status.ToString()
        };
    }
}
