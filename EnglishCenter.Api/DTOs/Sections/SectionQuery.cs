using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.DTOs.Sections;

public class SectionQuery : PagedQuery
{
    public int? CourseId { get; set; }
}
