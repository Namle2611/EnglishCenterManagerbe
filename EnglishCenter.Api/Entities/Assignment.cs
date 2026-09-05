using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.Entities;

public class Assignment
{
    public int Id { get; set; }
    public int ClassId { get; set; }
    public int TeacherId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? AttachmentUrl { get; set; }
    public DateTime Deadline { get; set; }
    public decimal MaxScore { get; set; }
    public AssignmentStatus Status { get; set; }

    // Navigation properties
    public CourseClass Class { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
    public ICollection<Submission> Submissions { get; set; } = new List<Submission>();
}
