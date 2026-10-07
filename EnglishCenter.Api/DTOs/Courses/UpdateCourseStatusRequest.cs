using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Courses;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateCourseStatusRequest : IValidatableObject
{
    [Required(ErrorMessage = "Status is required.")]
    public CourseStatus? Status { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status.HasValue && !Enum.IsDefined(typeof(CourseStatus), Status.Value))
        {
            yield return new ValidationResult("Invalid course status.", new[] { nameof(Status) });
        }
    }
}
