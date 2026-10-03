namespace EnglishCenter.Api.Configuration;

public class GeminiOptions
{
    public const string SectionName = "Gemini";

    public string? ApiKey { get; set; }
    public string Model { get; set; } = "gemini-3.8-flash";
    public int TimeoutSeconds { get; set; } = 30;
    public int MaxOutputTokens { get; set; } = 8192;
}
