using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Grades;

public class GradeQuery : PaginationQuery
{
    private string? _search;
    private string? _sortBy;

    public string? Search
    {
        get => _search;
        set => _search = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public ClassStudentStatus? MembershipStatus { get; set; }

    public string? SortBy
    {
        get => _sortBy;
        set => _sortBy = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public bool IsAscending { get; set; } = true;

    public void Normalize()
    {
        if (Page < 1)
        {
            Page = 1;
        }

        if (PageSize < 1)
        {
            PageSize = 10;
        }
        else if (PageSize > 100)
        {
            PageSize = 100;
        }

        var normalizedSort = SortBy?.Trim().ToLowerInvariant();
        if (normalizedSort is "studentcode" or "studentname" or "id")
        {
            SortBy = normalizedSort;
        }
        else
        {
            SortBy = "studentcode";
            IsAscending = true;
        }
    }
}
