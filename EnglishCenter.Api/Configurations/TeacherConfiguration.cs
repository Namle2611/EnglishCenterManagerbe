using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class TeacherConfiguration : IEntityTypeConfiguration<Teacher>
{
    public void Configure(EntityTypeBuilder<Teacher> builder)
    {
        builder.ToTable("Teachers", t =>
        {
            t.HasCheckConstraint("CK_Teachers_ExperienceYears", "[ExperienceYears] >= 0");
        });

        builder.HasKey(t => t.Id);

        builder.Property(t => t.TeacherCode)
            .IsRequired()
            .HasMaxLength(20);

        builder.HasIndex(t => t.TeacherCode)
            .IsUnique();

        builder.HasIndex(t => t.UserId)
            .IsUnique();

        builder.Property(t => t.Specialization)
            .IsRequired()
            .HasMaxLength(150);

        builder.Property(t => t.Qualification)
            .HasMaxLength(255);

        builder.Property(t => t.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(t => t.User)
            .WithOne(u => u.Teacher)
            .HasForeignKey<Teacher>(t => t.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Classes)
            .WithOne(c => c.Teacher)
            .HasForeignKey(c => c.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.AttendanceSessions)
            .WithOne(a => a.CreatedByTeacher)
            .HasForeignKey(a => a.CreatedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(t => t.Assignments)
            .WithOne(a => a.Teacher)
            .HasForeignKey(a => a.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
