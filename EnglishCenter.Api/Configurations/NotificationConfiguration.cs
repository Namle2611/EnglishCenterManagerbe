using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(n => n.Content)
            .IsRequired();

        builder.Property(n => n.IsRead)
            .HasDefaultValue(false);

        builder.HasIndex(n => new { n.ReceiverId, n.IsRead, n.CreatedAt });

        builder.HasOne(n => n.Sender)
            .WithMany(u => u.SentNotifications)
            .HasForeignKey(n => n.SenderId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Receiver)
            .WithMany(u => u.ReceivedNotifications)
            .HasForeignKey(n => n.ReceiverId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(n => n.Class)
            .WithMany(c => c.Notifications)
            .HasForeignKey(n => n.ClassId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
