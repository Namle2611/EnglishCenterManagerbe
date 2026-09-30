using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Assignments;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class CreateAssignmentRequest : IValidatableObject
{
    private string _title = string.Empty;
    private string? _description;
    private string? _attachmentUrl;

    [Required]
    public int? ClassId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Title
    {
        get => _title;
        set => _title = value ?? string.Empty;
    }

    public string? Description
    {
        get => _description;
        set => _description = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [MaxLength(500)]
    public string? AttachmentUrl
    {
        get => _attachmentUrl;
        set => _attachmentUrl = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [Required]
    public DateTime? Deadline { get; set; }

    [Required]
    public decimal? MaxScore { get; set; }

    [Required]
    public AssignmentStatus? Status { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (ClassId.HasValue && ClassId.Value <= 0)
        {
            yield return new ValidationResult("ClassId must be greater than 0.", new[] { nameof(ClassId) });
        }

        if (string.IsNullOrWhiteSpace(Title))
        {
            yield return new ValidationResult("Title is required.", new[] { nameof(Title) });
        }
        else if (Title.Trim().Length > 200)
        {
            yield return new ValidationResult("Title cannot exceed 200 characters.", new[] { nameof(Title) });
        }

        if (!string.IsNullOrWhiteSpace(AttachmentUrl))
        {
            if (!Uri.TryCreate(AttachmentUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                yield return new ValidationResult("AttachmentUrl must be a valid HTTP or HTTPS URL.", new[] { nameof(AttachmentUrl) });
            }
        }

        if (Deadline.HasValue)
        {
            if (Deadline.Value <= DateTime.UtcNow)
            {
                yield return new ValidationResult("Deadline must be strictly in the future.", new[] { nameof(Deadline) });
            }
        }

        if (MaxScore.HasValue)
        {
            if (MaxScore.Value <= 0 || MaxScore.Value > 999.99m)
            {
                yield return new ValidationResult("MaxScore must be greater than 0 and less than or equal to 999.99.", new[] { nameof(MaxScore) });
            }
        }

        if (Status.HasValue && !Enum.IsDefined(typeof(AssignmentStatus), Status.Value))
        {
            yield return new ValidationResult("Invalid assignment status.", new[] { nameof(Status) });
        }
    }
}
