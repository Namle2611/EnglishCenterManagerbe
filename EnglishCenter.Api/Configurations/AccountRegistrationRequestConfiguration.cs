using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class AccountRegistrationRequestConfiguration : IEntityTypeConfiguration<AccountRegistrationRequest>
{
    public void Configure(EntityTypeBuilder<AccountRegistrationRequest> builder)
    {
        builder.ToTable("AccountRegistrationRequests");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Email)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(r => r.NormalizedEmail)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(r => r.FullName)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(r => r.PasswordHash)
            .HasMaxLength(500)
            .IsRequired(false);

        builder.Property(r => r.Phone)
            .HasMaxLength(20);

        builder.Property(r => r.RequestedRole)
            .IsRequired()
            .HasMaxLength(30);

        builder.Property(r => r.Status)
            .HasConversion<string>()
            .HasMaxLength(30)
            .IsRequired();

        builder.Property(r => r.OtpHash)
            .HasMaxLength(255);

        builder.Property(r => r.RejectionReason)
            .HasMaxLength(500);

        builder.Property(r => r.Specialization)
            .HasMaxLength(150);

        builder.Property(r => r.Qualification)
            .HasMaxLength(255);

        builder.Property(r => r.Gender)
            .HasMaxLength(20);

        builder.Property(r => r.Address)
            .HasMaxLength(500);

        builder.HasIndex(r => r.NormalizedEmail)
            .IsUnique()
            .HasFilter("[Status] IN ('PendingEmailVerification', 'PendingApproval')")
            .HasDatabaseName("IX_AccountRegistrationRequests_NormalizedEmail_Active");

        builder.HasIndex(r => r.Status);
        builder.HasIndex(r => r.RequestedRole);
        builder.HasIndex(r => r.CreatedAt);

        builder.HasOne(r => r.ReviewedByUser)
            .WithMany()
            .HasForeignKey(r => r.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
