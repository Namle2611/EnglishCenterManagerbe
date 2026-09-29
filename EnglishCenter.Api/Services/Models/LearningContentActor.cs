namespace EnglishCenter.Api.Services.Models;

public class LearningContentActor
{
    public int UserId { get; set; }
    public bool IsAdmin { get; set; }
    public bool IsStaff { get; set; }
    public bool IsTeacher { get; set; }
}
