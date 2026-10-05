namespace EnglishCenter.Api.DTOs.Grades;

public class GradeReportingSummaryResponse
{
    public int VisibleGradedItemCount { get; set; }
    public int PendingItemCount { get; set; }
    public decimal VisibleEarnedPoints { get; set; }
    public decimal VisiblePossiblePoints { get; set; }
    public decimal? VisiblePercentage { get; set; }
}
