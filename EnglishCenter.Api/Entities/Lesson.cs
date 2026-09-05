using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Lesson
{
    public int Id { get; set; }
    public int SectionId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string? DocumentUrl { get; set; }
    public int OrderIndex { get; set; }
    public LessonStatus Status { get; set; }

    // Navigation properties
    public Section Section { get; set; } = null!;
}
