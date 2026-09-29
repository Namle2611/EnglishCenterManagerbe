using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Lessons;

public class LessonQuery : PagedQuery
{
    public int? SectionId { get; set; }
    public int? CourseId { get; set; }
    public LessonStatus? Status { get; set; }
}
