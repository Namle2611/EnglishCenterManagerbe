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
        var adminEmail = (_configuration["AdminSeed:Email"] ?? "admin@englishcenter.local").Trim();
        var adminFullName = _configuration["AdminSeed:FullName"] ?? "System Administrator";
        var adminPassword = _configuration["AdminSeed:Password"];

        var existingUser = await _context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == adminEmail.ToLower());

        var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.Admin);
        if (adminRole == null)
        {
            throw new InvalidOperationException("ADMIN role does not exist in the database.");
        }

        if (existingUser == null)
        {
            if (string.IsNullOrWhiteSpace(adminPassword))
            {
                throw new InvalidOperationException("AdminSeed:Password is required in Development to seed initial Admin user.");
            }

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
            // Do not reset password or overwrite FullName. Ensure ADMIN role is attached.
            var hasAdminRole = existingUser.UserRoles.Any(ur => ur.RoleId == adminRole.Id);
            if (!hasAdminRole)
            {
                _context.UserRoles.Add(new UserRole
                {
                    UserId = existingUser.Id,
                    RoleId = adminRole.Id
                });
                await _context.SaveChangesAsync();
                _logger.LogInformation("Assigned ADMIN role to existing user: {Email}", adminEmail);
            }
        }
    }
}
