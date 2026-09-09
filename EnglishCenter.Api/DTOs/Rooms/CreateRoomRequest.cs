using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Rooms;

public class CreateRoomRequest : IValidatableObject
{
    private string _roomCode = string.Empty;
    private string? _roomName;

    [Required(ErrorMessage = "RoomCode is required.")]
    [MaxLength(30, ErrorMessage = "RoomCode cannot exceed 30 characters.")]
    public string RoomCode
    {
        get => _roomCode;
        set => _roomCode = value?.Trim() ?? string.Empty;
    }

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
        if (string.IsNullOrWhiteSpace(RoomCode))
        {
            yield return new ValidationResult("RoomCode is required.", new[] { nameof(RoomCode) });
        }

        if (Capacity.HasValue && Capacity.Value <= 0)
        {
            yield return new ValidationResult("Capacity must be greater than 0.", new[] { nameof(Capacity) });
        }
    }
}
