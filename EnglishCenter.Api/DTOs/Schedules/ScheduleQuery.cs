using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.DTOs.Common;

namespace EnglishCenter.Api.DTOs.Schedules;

public class ScheduleQuery : PagedQuery, IValidatableObject
{
    public int? ClassId { get; set; }
    public int? RoomId { get; set; }
    public int? TeacherId { get; set; }
    public int? DayOfWeek { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (DayOfWeek.HasValue && (DayOfWeek.Value < 1 || DayOfWeek.Value > 7))
        {
            yield return new ValidationResult("DayOfWeek must be between 1 and 7.", new[] { nameof(DayOfWeek) });
        }
        if (ClassId.HasValue && ClassId.Value <= 0)
        {
            yield return new ValidationResult("ClassId must be greater than 0.", new[] { nameof(ClassId) });
        }
        if (RoomId.HasValue && RoomId.Value <= 0)
        {
            yield return new ValidationResult("RoomId must be greater than 0.", new[] { nameof(RoomId) });
        }
        if (TeacherId.HasValue && TeacherId.Value <= 0)
        {
            yield return new ValidationResult("TeacherId must be greater than 0.", new[] { nameof(TeacherId) });
        }
    }
}
