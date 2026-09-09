using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.DTOs.Classes;

public class TeacherLookupQuery : PaginationQuery
{
    private string? _search;

    public string? Search
    {
        get => _search;
        set => _search = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }
}
