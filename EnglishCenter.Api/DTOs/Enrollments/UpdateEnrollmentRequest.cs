using System.ComponentModel.DataAnnotations;

namespace EnglishCenter.Api.DTOs.Enrollments;

public class UpdateEnrollmentRequest
{
    [Required(ErrorMessage = "TuitionAmount is required.")]
    [Range(0, 1000000000, ErrorMessage = "TuitionAmount must be greater than or equal to 0.")]
    public decimal? TuitionAmount { get; set; }
}
