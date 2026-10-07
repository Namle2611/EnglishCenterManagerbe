using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Classes;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateClassStatusRequest : IValidatableObject
{
    [Required(ErrorMessage = "Status is required.")]
    public ClassStatus? Status { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status.HasValue && !Enum.IsDefined(typeof(ClassStatus), Status.Value))
        {
            yield return new ValidationResult("Invalid class status.", new[] { nameof(Status) });
        }
    }
}
