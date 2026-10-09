using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.DTOs.Registration;
using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Repositories.Interfaces;

public interface IRegistrationRequestRepository
{
    Task<AccountRegistrationRequest?> GetByIdAsync(int id, CancellationToken cancellationToken = default);
    Task<AccountRegistrationRequest?> GetPendingByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<AccountRegistrationRequest?> GetActiveByEmailAsync(string normalizedEmail, CancellationToken cancellationToken = default);
    Task<PagedResult<RegistrationRequestDto>> GetPagedAsync(RegistrationRequestQuery query, CancellationToken cancellationToken = default);
    Task AddAsync(AccountRegistrationRequest entity, CancellationToken cancellationToken = default);
    Task UpdateAsync(AccountRegistrationRequest entity, CancellationToken cancellationToken = default);
    Task SaveChangesAsync(CancellationToken cancellationToken = default);
}
