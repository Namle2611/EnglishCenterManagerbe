namespace EnglishCenter.Api.DTOs.Sections;

public class SectionDetailResponse
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public int LessonCount { get; set; }
}
