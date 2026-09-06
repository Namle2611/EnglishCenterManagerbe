using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Students;

public class StudentQuery : PagedQuery
{
    public StudentStatus? Status { get; set; }

    private string? _currentLevel;
    public string? CurrentLevel
    {
        get => _currentLevel;
        set => _currentLevel = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
