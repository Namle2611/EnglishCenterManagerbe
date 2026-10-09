namespace EnglishCenter.Api.Configuration;

public class SePayOptions
{
    public const string SectionName = "SePay";

    public string BankCode { get; set; } = string.Empty;
    public string BankAccount { get; set; } = string.Empty;
    public string AccountHolder { get; set; } = string.Empty;
    public string PaymentPrefix { get; set; } = "EC";
    public string WebhookSecret { get; set; } = string.Empty;
}
