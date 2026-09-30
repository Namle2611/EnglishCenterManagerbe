using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Submissions;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateSubmissionRequest : IValidatableObject
{
    private string? _fileUrl;
    private string? _content;

    [MaxLength(500)]
    public string? FileUrl
    {
        get => _fileUrl;
        set => _fileUrl = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public string? Content
    {
        get => _content;
        set => _content = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FileUrl) && string.IsNullOrWhiteSpace(Content))
        {
            yield return new ValidationResult("At least one of FileUrl or Content must be provided.", new[] { nameof(FileUrl), nameof(Content) });
        }

        if (!string.IsNullOrWhiteSpace(FileUrl))
        {
            if (!Uri.TryCreate(FileUrl, UriKind.Absolute, out var uri) ||
                (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            {
                yield return new ValidationResult("FileUrl must be a valid HTTP or HTTPS URL.", new[] { nameof(FileUrl) });
            }
        }
    }
}
