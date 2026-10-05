using EnglishCenter.Api.DTOs.Common;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Grades;

public class ClassGradebookResponse
{
    public int ClassId { get; set; }
    public string ClassCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public string TeacherName { get; set; } = string.Empty;
    public ClassStatus ClassStatus { get; set; }
    public PagedResult<GradeStudentRosterItemResponse> Roster { get; set; } = new();
}
