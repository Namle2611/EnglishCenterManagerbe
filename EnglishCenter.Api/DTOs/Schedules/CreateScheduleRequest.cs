using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Schedules;

public class CreateScheduleRequest
{
    [Required(ErrorMessage = "ClassId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "ClassId must be greater than 0.")]
    public int? ClassId { get; set; }

    [Required(ErrorMessage = "RoomId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "RoomId must be greater than 0.")]
    public int? RoomId { get; set; }

    [Required(ErrorMessage = "DayOfWeek is required.")]
    [Range(1, 7, ErrorMessage = "DayOfWeek must be between 1 and 7.")]
    public int? DayOfWeek { get; set; }

    [Required(ErrorMessage = "StartTime is required.")]
    public TimeSpan? StartTime { get; set; }

    [Required(ErrorMessage = "EndTime is required.")]
    public TimeSpan? EndTime { get; set; }
}
