using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<User?> GetWithRolesAsync(int id);
    Task<User?> GetWithRolesByEmailAsync(string email);
    Task AddAsync(User user);
    Task UpdateAsync(User user);
}
