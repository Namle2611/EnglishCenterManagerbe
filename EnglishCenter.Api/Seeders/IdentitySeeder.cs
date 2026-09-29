using EnglishCenter.Api.Data;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Seeders;

public class IdentitySeeder
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasherService _passwordHasher;
    private readonly IWebHostEnvironment _environment;
    private readonly ILogger<IdentitySeeder> _logger;

    public IdentitySeeder(
        AppDbContext context,
        IConfiguration configuration,
        IPasswordHasherService passwordHasher,
        IWebHostEnvironment environment,
        ILogger<IdentitySeeder> logger)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = passwordHasher;
        _environment = environment;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        await SeedRolesAsync();

        if (_environment.IsDevelopment())
        {
            await SeedAdminAsync();
            await SeedStandardAccountsAsync();
        }
    }

    private async Task SeedRolesAsync()
    {
        foreach (var roleName in RoleNames.AllRoles)
        {
            var exists = await _context.Roles.AnyAsync(r => r.Name == roleName);
            if (!exists)
            {
                _context.Roles.Add(new Role
                {
                    Name = roleName,
                    Description = $"{roleName} role"
                });
                _logger.LogInformation("Seeded role: {RoleName}", roleName);
            }
        }

        await _context.SaveChangesAsync();
    }

    private async Task SeedAdminAsync()
    {
        var adminEmail = (_configuration["AdminSeed:Email"] ?? "admincenter@gmail.com").Trim();
        var adminFullName = _configuration["AdminSeed:FullName"] ?? "System Administrator";
        var adminPassword = _configuration["AdminSeed:Password"] ?? "admin123456";

        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.Admin);
        if (adminRole == null)
        {
            throw new InvalidOperationException("ADMIN role does not exist in the database.");
        }

        // Migrate existing accounts to @gmail.com domain
        await MigrateLegacyEmailsAsync();

        var existingUser = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == adminEmail.ToLower());

        if (existingUser == null)
        {
            var adminUser = new User
            {
                Email = adminEmail,
                FullName = adminFullName,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, adminPassword);
            _context.Users.Add(adminUser);
            await _context.SaveChangesAsync();

            _context.UserRoles.Add(new UserRole
            {
                UserId = adminUser.Id,
                RoleId = adminRole.Id
            });
            await _context.SaveChangesAsync();

            _logger.LogInformation("Seeded initial Admin user: {Email}", adminEmail);
        }
        else
        {
            // Sync password and FullName in development so changing configuration applies
            existingUser.FullName = adminFullName;
            existingUser.PasswordHash = _passwordHasher.HashPassword(existingUser, adminPassword);

            var hasAdminRole = existingUser.UserRoles.Any(ur => ur.RoleId == adminRole.Id);
            if (!hasAdminRole)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = existingUser.Id,
                    RoleId = adminRole.Id
                });
            }
            await _context.SaveChangesAsync();
            _logger.LogInformation("Updated development Admin user credentials: {Email}", adminEmail);
        }
    }

    private async Task MigrateLegacyEmailsAsync()
    {
        var users = await _context.Users.ToListAsync();
        bool hasChanges = false;

        foreach (var user in users)
        {
            var email = user.Email?.Trim();
            if (string.IsNullOrWhiteSpace(email))
            {
                continue;
            }

            if (email.Equals("admin@englishcenter.local", StringComparison.OrdinalIgnoreCase))
            {
                var newEmail = "admincenter@gmail.com";
                if (!users.Any(u => u.Id != user.Id && u.Email.Equals(newEmail, StringComparison.OrdinalIgnoreCase)))
                {
                    _logger.LogInformation("Migrating admin email from {OldEmail} to {NewEmail}", user.Email, newEmail);
                    user.Email = newEmail;
                    hasChanges = true;
                }
            }
            else if (!email.EndsWith("@gmail.com", StringComparison.OrdinalIgnoreCase))
            {
                var atIndex = email.IndexOf('@');
                var localPart = atIndex > 0 ? email.Substring(0, atIndex) : email;
                var baseNewEmail = $"{localPart}@gmail.com";
                var candidateEmail = baseNewEmail;
                int suffix = 1;

                while (users.Any(u => u.Id != user.Id && u.Email.Equals(candidateEmail, StringComparison.OrdinalIgnoreCase)))
                {
                    candidateEmail = $"{localPart}{suffix}@gmail.com";
                    suffix++;
                }

                _logger.LogInformation("Migrating user email from {OldEmail} to {NewEmail}", user.Email, candidateEmail);
                user.Email = candidateEmail;
                hasChanges = true;
            }
        }

        if (hasChanges)
        {
            await _context.SaveChangesAsync();
        }
    }

    private async Task SeedStandardAccountsAsync()
    {
        var teacherRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.Teacher);
        var staffRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.Staff);
        var studentRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.Student);

        if (teacherRole == null || staffRole == null || studentRole == null)
        {
            return;
        }

        // 1. Staff accounts: staff01@gmail.com -> staff10@gmail.com (pwd: staff123456)
        var staffUsers = await _context.Users
            .Where(u => u.UserRoles.Any(ur => ur.RoleId == staffRole.Id))
            .OrderBy(u => u.Id)
            .Take(10)
            .ToListAsync();

        for (int i = 1; i <= 10; i++)
        {
            var email = $"staff{i:D2}@gmail.com";
            var pwd = "staff123456";
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (existing != null)
            {
                existing.FullName = $"Nhân Viên {i:D2}";
                existing.IsActive = true;
                existing.PasswordHash = _passwordHasher.HashPassword(existing, pwd);
                if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == existing.Id && ur.RoleId == staffRole.Id))
                {
                    _context.UserRoles.Add(new UserRole { UserId = existing.Id, RoleId = staffRole.Id });
                }
            }
            else if (i - 1 < staffUsers.Count)
            {
                var target = staffUsers[i - 1];
                target.Email = email;
                target.FullName = $"Nhân Viên {i:D2}";
                target.IsActive = true;
                target.PasswordHash = _passwordHasher.HashPassword(target, pwd);
            }
            else
            {
                var newUser = new User
                {
                    Email = email,
                    FullName = $"Nhân Viên {i:D2}",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };
                newUser.PasswordHash = _passwordHasher.HashPassword(newUser, pwd);
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();
                _context.UserRoles.Add(new UserRole { UserId = newUser.Id, RoleId = staffRole.Id });
            }
        }
        await _context.SaveChangesAsync();

        // 2. Teacher accounts: teacher01@gmail.com -> teacher10@gmail.com (pwd: teacher123456)
        var teachers = await _context.Teachers
            .Include(t => t.User)
            .OrderBy(t => t.Id)
            .Take(10)
            .ToListAsync();

        for (int i = 1; i <= 10; i++)
        {
            var email = $"teacher{i:D2}@gmail.com";
            var pwd = "teacher123456";
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (existing != null)
            {
                existing.FullName = $"Giáo Viên {i:D2}";
                existing.IsActive = true;
                existing.PasswordHash = _passwordHasher.HashPassword(existing, pwd);
                if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == existing.Id && ur.RoleId == teacherRole.Id))
                {
                    _context.UserRoles.Add(new UserRole { UserId = existing.Id, RoleId = teacherRole.Id });
                }
            }
            else if (i - 1 < teachers.Count)
            {
                var targetUser = teachers[i - 1].User;
                targetUser.Email = email;
                targetUser.FullName = $"Giáo Viên {i:D2}";
                targetUser.IsActive = true;
                targetUser.PasswordHash = _passwordHasher.HashPassword(targetUser, pwd);
            }
        }
        await _context.SaveChangesAsync();

        // 3. Student accounts: student01@gmail.com -> student10@gmail.com (pwd: student123456)
        var students = await _context.Students
            .Include(s => s.User)
            .OrderBy(s => s.Id)
            .Take(10)
            .ToListAsync();

        for (int i = 1; i <= 10; i++)
        {
            var email = $"student{i:D2}@gmail.com";
            var pwd = "student123456";
            var existing = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());
            if (existing != null)
            {
                existing.FullName = $"Học Viên {i:D2}";
                existing.IsActive = true;
                existing.PasswordHash = _passwordHasher.HashPassword(existing, pwd);
                if (!await _context.UserRoles.AnyAsync(ur => ur.UserId == existing.Id && ur.RoleId == studentRole.Id))
                {
                    _context.UserRoles.Add(new UserRole { UserId = existing.Id, RoleId = studentRole.Id });
                }
            }
            else if (i - 1 < students.Count)
            {
                var targetUser = students[i - 1].User;
                targetUser.Email = email;
                targetUser.FullName = $"Học Viên {i:D2}";
                targetUser.IsActive = true;
                targetUser.PasswordHash = _passwordHasher.HashPassword(targetUser, pwd);
            }
        }
        await _context.SaveChangesAsync();

        _logger.LogInformation("Seeded and synchronized 10 Staff, 10 Teacher, and 10 Student standard accounts.");
    }
}
