using EnglishCenter.Api.Enums;

namespace EnglishCenter.Api.DTOs.Assignments;

public class AssignmentDetailResponse : AssignmentListItemResponse
{
    public string? Description { get; set; }
    public string? AttachmentUrl { get; set; }
    public ClassStatus ClassStatus { get; set; }
}
