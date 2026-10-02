namespace EnglishCenter.Api.Services.Models;

public sealed class QuizActor
{
    public required int UserId { get; init; }
    public required bool IsAdmin { get; init; }
    public required bool IsStaff { get; init; }
    public required bool IsTeacher { get; init; }
    public required bool IsStudent { get; init; }

    public bool CanManageAll => IsAdmin || IsStaff;
}
