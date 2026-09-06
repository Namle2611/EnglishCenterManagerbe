using System.ComponentModel.DataAnnotations;
using EnglishCenter.Api.Common.Attributes;

namespace EnglishCenter.Api.DTOs.Courses;

public class UpdateCourseRequest
{
    private string _courseName = string.Empty;
    private string? _description;
    private string? _level;

    [Required(ErrorMessage = "CourseName is required.")]
    [MaxLength(200, ErrorMessage = "CourseName cannot exceed 200 characters.")]
    public string CourseName
    {
        get => _courseName;
        set => _courseName = value?.Trim() ?? string.Empty;
    }

    public string? Description
    {
        get => _description;
        set => _description = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [MaxLength(50, ErrorMessage = "Level cannot exceed 50 characters.")]
    public string? Level
    {
        get => _level;
        set => _level = string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    [Required(ErrorMessage = "DurationMonths is required.")]
    [Range(1, int.MaxValue, ErrorMessage = "DurationMonths must be greater than 0.")]
    public int? DurationMonths { get; set; }

    [Required(ErrorMessage = "TuitionFee is required.")]
    [DecimalPrecisionScale(18, 2, 0)]
    public decimal? TuitionFee { get; set; }
}
