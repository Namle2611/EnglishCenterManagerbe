namespace EnglishCenter.Api.Entities;

public class Grade
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int ClassId { get; set; }
    public decimal? AttendanceScore { get; set; }
    public decimal? AssignmentScore { get; set; }
    public decimal? QuizScore { get; set; }
    public decimal? MidtermScore { get; set; }
    public decimal? FinalScore { get; set; }
    public decimal? TotalScore { get; set; }

    // Navigation properties
    public Student Student { get; set; } = null!;
    public CourseClass Class { get; set; } = null!;
}
