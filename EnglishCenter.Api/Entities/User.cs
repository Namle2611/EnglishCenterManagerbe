namespace EnglishCenter.Api.Entities;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    // Navigation properties
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public Student? Student { get; set; }
    public Teacher? Teacher { get; set; }
    public ICollection<Enrollment> ConfirmedEnrollments { get; set; } = new List<Enrollment>();
    public ICollection<Notification> SentNotifications { get; set; } = new List<Notification>();
    public ICollection<Notification> ReceivedNotifications { get; set; } = new List<Notification>();
}
