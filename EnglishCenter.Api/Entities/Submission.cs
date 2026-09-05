namespace EnglishCenter.Api.Entities;

public class Submission
{
    public int Id { get; set; }
    public int AssignmentId { get; set; }
    public int StudentId { get; set; }
    public string? FileUrl { get; set; }
    public string? Content { get; set; }
    public DateTime SubmittedAt { get; set; }
    public decimal? Score { get; set; }
    public string? Feedback { get; set; }

    // Navigation properties
    public Assignment Assignment { get; set; } = null!;
    public Student Student { get; set; } = null!;
}
