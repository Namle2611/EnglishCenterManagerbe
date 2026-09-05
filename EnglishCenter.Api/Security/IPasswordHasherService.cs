using EnglishCenter.Api.Entities;

namespace EnglishCenter.Api.Security;

public interface IPasswordHasherService
{
    string HashPassword(User user, string password);
    bool VerifyPassword(User user, string hashedPassword, string providedPassword);
}
