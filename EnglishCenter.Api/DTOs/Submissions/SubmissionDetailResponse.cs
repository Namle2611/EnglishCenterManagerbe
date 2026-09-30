namespace EnglishCenter.Api.DTOs.Submissions;

public class SubmissionDetailResponse : SubmissionListItemResponse
{
    public string AssignmentTitle { get; set; } = string.Empty;
    public DateTime Deadline { get; set; }
    public decimal MaxScore { get; set; }
}
