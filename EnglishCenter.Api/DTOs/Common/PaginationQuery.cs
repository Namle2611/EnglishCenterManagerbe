using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.Common;

namespace EnglishCenter.Api.DTOs.Common;

public class PaginationQuery
{
    [Range(1, int.MaxValue, ErrorMessage = "Page must be greater than or equal to 1.")]
    public int Page { get; set; } = ValidationConstants.DefaultPageNumber;

    [Range(1, ValidationConstants.MaxPageSize, ErrorMessage = "PageSize must be between 1 and 100.")]
    public int PageSize { get; set; } = ValidationConstants.DefaultPageSize;
}
