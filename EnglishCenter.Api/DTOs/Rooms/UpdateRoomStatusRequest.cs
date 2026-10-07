using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Rooms;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateRoomStatusRequest : IValidatableObject
{
    [Required(ErrorMessage = "Status is required.")]
    public RoomStatus? Status { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Status.HasValue && !Enum.IsDefined(typeof(RoomStatus), Status.Value))
        {
            yield return new ValidationResult("Invalid room status.", new[] { nameof(Status) });
        }
    }
}
