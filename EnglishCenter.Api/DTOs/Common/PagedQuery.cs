using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Common;

public class PagedQuery : PaginationQuery
{
    private string? _search;
    private string? _sortDirection;

    public string? Search
    {
        get => _search;
        set => _search = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public string? SortBy { get; set; }

    [RegularExpression("^(?i)(asc|desc)?$", ErrorMessage = "SortDirection must be either 'asc' or 'desc'.")]
    public string? SortDirection
    {
        get => string.IsNullOrWhiteSpace(_sortDirection) ? "desc" : _sortDirection;
        set => _sortDirection = string.IsNullOrWhiteSpace(value) ? null : value.Trim().ToLowerInvariant();
    }

    public bool IsAscending => string.Equals(SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
}
