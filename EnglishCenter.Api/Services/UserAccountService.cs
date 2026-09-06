using EnglishCenter.Api.Common;
using EnglishCenter.Api.Common.Exceptions;
using EnglishCenter.Api.Data;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using EnglishCenter.Api.Security;
using EnglishCenter.Api.Services.Interfaces;
using EnglishCenter.Api.Services.Models;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Services;

public class UserAccountService : IUserAccountService
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly ILogger<UserAccountService> _logger;

    public UserAccountService(
        AppDbContext context,
        IUserRepository userRepository,
        IPasswordHasherService passwordHasher,
        ILogger<UserAccountService> logger)
    {
        _context = context;
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _logger = logger;
    }

    public async Task<User> CreateUserAccountAsync(CreateUserAccountCommand command, CancellationToken cancellationToken = default)
    {
        if (command == null)
        {
            throw new ValidationException("Command cannot be null.");
        }

        var email = command.Email?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(email))
        {
            throw new ValidationException("Email is required.");
        }

        if (email.Length > ValidationConstants.EmailMaxLength)
        {
            throw new ValidationException($"Email cannot exceed {ValidationConstants.EmailMaxLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(command.FullName))
        {
            throw new ValidationException("FullName is required.");
        }

        if (command.FullName.Trim().Length > ValidationConstants.FullNameMaxLength)
        {
            throw new ValidationException($"FullName cannot exceed {ValidationConstants.FullNameMaxLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(command.Password) || command.Password.Length < ValidationConstants.PasswordMinLength)
        {
            throw new ValidationException($"Password must be at least {ValidationConstants.PasswordMinLength} characters.");
        }

        if (string.IsNullOrWhiteSpace(command.RoleName))
        {
            throw new ValidationException("RoleName is required.");
        }

        var normalizedRoleName = command.RoleName.Trim().ToUpperInvariant();
        if (!RoleNames.AllRoles.Contains(normalizedRoleName))
        {
            throw new ValidationException($"Role '{command.RoleName}' is not a valid system role.");
        }

        // Application-level uniqueness check
        var emailExists = await _userRepository.EmailExistsAsync(email, cancellationToken);
        if (emailExists)
        {
            throw new ConflictException($"Email '{email}' is already in use.");
        }

        // Look up role dynamically by Name (do not hardcode Role ID)
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Name == normalizedRoleName, cancellationToken);
        if (role == null)
        {
            throw new ValidationException($"Role '{normalizedRoleName}' does not exist in the database.");
        }

        var user = new User
        {
            Email = email,
            FullName = command.FullName.Trim(),
            Phone = string.IsNullOrWhiteSpace(command.Phone) ? null : command.Phone.Trim(),
            IsActive = command.IsActive,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, command.Password);
        _context.Users.Add(user);

        var userRole = new UserRole
        {
            User = user,
            Role = role
        };
        _context.UserRoles.Add(userRole);

        try
        {
            // Flushes entities to generate IDs without committing outer transaction
            await _context.SaveChangesAsync(cancellationToken);
            _logger.LogInformation("Created user account {UserId} with role {RoleName}", user.Id, normalizedRoleName);
            return user;
        }
        catch (DbUpdateException ex) when (IsUniqueConstraintViolation(ex))
        {
            _logger.LogWarning(ex, "Database unique constraint violation during user account creation for {Email}", email);
            throw new ConflictException($"Email '{email}' is already in use.");
        }
    }

    public async Task<bool> IsEmailUniqueAsync(string email, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return false;
        }

        var exists = await _userRepository.EmailExistsAsync(email.Trim(), cancellationToken);
        return !exists;
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
