using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Attendances;

public class AttendanceSessionQuery
{
    [Required]
    [Range(1, int.MaxValue)]
    public int? ClassId { get; set; }

    [Required]
    public DateOnly? SessionDate { get; set; }

    [Required]
    public TimeSpan? StartTime { get; set; }
}
