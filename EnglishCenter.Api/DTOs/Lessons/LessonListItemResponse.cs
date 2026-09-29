using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Lessons;

public class LessonListItemResponse
{
    public int Id { get; set; }
    public int SectionId { get; set; }
    public string SectionTitle { get; set; } = string.Empty;
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public bool HasContent { get; set; }
    public bool HasVideo { get; set; }
    public bool HasAudio { get; set; }
    public bool HasDocument { get; set; }
    public int OrderIndex { get; set; }
    public LessonStatus Status { get; set; }
}
