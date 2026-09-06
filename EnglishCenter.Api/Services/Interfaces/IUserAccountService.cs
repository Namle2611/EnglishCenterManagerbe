using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Services.Models;

namespace EnglishCenter.Api.Services.Interfaces;

public interface IUserAccountService
{
    Task<User> CreateUserAccountAsync(CreateUserAccountCommand command, CancellationToken cancellationToken = default);
    Task<bool> IsEmailUniqueAsync(string email, CancellationToken cancellationToken = default);
}
