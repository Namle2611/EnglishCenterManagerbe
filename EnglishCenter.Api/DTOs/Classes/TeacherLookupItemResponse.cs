namespace EnglishCenter.Api.DTOs.Classes;

public class TeacherLookupItemResponse
{
    public int Id { get; set; }
    public string TeacherCode { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Specialization { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
}
