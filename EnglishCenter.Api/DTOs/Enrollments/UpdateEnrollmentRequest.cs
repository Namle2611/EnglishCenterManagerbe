using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Enrollments;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class UpdateEnrollmentRequest
{
    [Required(ErrorMessage = "TuitionAmount is required.")]
    [Range(0, 1000000000, ErrorMessage = "TuitionAmount must be greater than or equal to 0.")]
    public decimal? TuitionAmount { get; set; }
}
