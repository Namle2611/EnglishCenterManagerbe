using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Quizzes;

public class TeacherQuizClassLookupItemResponse
{
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public ClassStatus Status { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int QuizCount { get; set; }
}
