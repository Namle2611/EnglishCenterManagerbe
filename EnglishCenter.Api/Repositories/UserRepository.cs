using EnglishCenter.Api.Data;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLower();
        return await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
    }

    public async Task<User?> GetByIdAsync(int id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetWithRolesAsync(int id)
    {
        return await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<User?> GetWithRolesByEmailAsync(string email)
    {
        var normalized = email.Trim().ToLower();
        return await _context.Users
            .Include(u => u.UserRoles)
            .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized);
    }

    public async Task AddAsync(User user)
    {
        await _context.Users.AddAsync(user);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(User user)
    {
        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken = default)
    {
        var trimmedEmail = email.Trim();
        return await _context.Users
            .AnyAsync(u => u.Email == trimmedEmail, cancellationToken);
    }

    public async Task<bool> EmailExistsExceptUserAsync(string email, int userId, CancellationToken cancellationToken = default)
    {
        var trimmedEmail = email.Trim();
        return await _context.Users
            .AnyAsync(u => u.Email == trimmedEmail && u.Id != userId, cancellationToken);
    }
}
