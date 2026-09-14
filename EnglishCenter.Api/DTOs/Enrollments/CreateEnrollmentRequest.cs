using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace EnglishCenter.Api.DTOs.Enrollments;

[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public class CreateEnrollmentRequest
{
    [Required(ErrorMessage = "StudentId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "StudentId must be greater than 0.")]
    public int? StudentId { get; set; }

    [Required(ErrorMessage = "CourseId is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "CourseId must be greater than 0.")]
    public int? CourseId { get; set; }

    [Range(0, 1000000000, ErrorMessage = "TuitionAmount must be greater than or equal to 0.")]
    public decimal? TuitionAmount { get; set; }

    public DateTime? EnrollmentDate { get; set; }
}
