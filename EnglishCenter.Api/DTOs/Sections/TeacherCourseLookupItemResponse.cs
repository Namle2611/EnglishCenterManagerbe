namespace EnglishCenter.Api.DTOs.Sections;

public class TeacherCourseLookupItemResponse
{
    public int CourseId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string? Level { get; set; }
}
