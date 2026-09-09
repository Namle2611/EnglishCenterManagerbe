using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Rooms;

public class UpdateRoomRequest : IValidatableObject
{
    private string? _roomName;

    [MaxLength(100, ErrorMessage = "RoomName cannot exceed 100 characters.")]
    public string? RoomName
    {
        get => _roomName;
        set => _roomName = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [Required(ErrorMessage = "Capacity is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "Capacity must be greater than 0.")]
    public int? Capacity { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Capacity.HasValue && Capacity.Value <= 0)
        {
            yield return new ValidationResult("Capacity must be greater than 0.", new[] { nameof(Capacity) });
        }
    }
}
