using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Lessons;

public class LessonDetailResponse
{
    public int Id { get; set; }
    public int SectionId { get; set; }
    public string SectionTitle { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string? DocumentUrl { get; set; }
    public int OrderIndex { get; set; }
    public LessonStatus Status { get; set; }
}
