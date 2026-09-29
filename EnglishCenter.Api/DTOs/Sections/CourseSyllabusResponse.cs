using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Sections;

public class CourseSyllabusResponse
{
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string? Level { get; set; }
    public List<SyllabusSectionItem> Sections { get; set; } = new();
}

public class SyllabusSectionItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int OrderIndex { get; set; }
    public List<SyllabusLessonItem> Lessons { get; set; } = new();
}

public class SyllabusLessonItem
{
    public int Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Content { get; set; }
    public string? VideoUrl { get; set; }
    public string? AudioUrl { get; set; }
    public string? DocumentUrl { get; set; }
    public int OrderIndex { get; set; }
    public LessonStatus Status { get; set; }
}
