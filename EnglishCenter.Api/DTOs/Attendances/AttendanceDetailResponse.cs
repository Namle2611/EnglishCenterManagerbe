using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Attendances;

public class AttendanceDetailResponse : AttendanceListItemResponse
{
    public ClassStatus ClassStatus { get; set; }
    public DateTime ClassStartDate { get; set; }
    public DateTime ClassEndDate { get; set; }
    public int CreatedByTeacherId { get; set; }
    public string CreatedByTeacherCode { get; set; } = string.Empty;
    public string CreatedByTeacherName { get; set; } = string.Empty;
    public ClassStudentStatus? ClassStudentStatus { get; set; }
    public DateTime? ClassJoinedAt { get; set; }
}
