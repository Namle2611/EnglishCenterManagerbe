using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
{
    public void Configure(EntityTypeBuilder<Enrollment> builder)
    {
        builder.ToTable("Enrollments", t =>
        {
            t.HasCheckConstraint("CK_Enrollments_TuitionAmount", "[TuitionAmount] >= 0");
        });

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TuitionAmount)
            .HasPrecision(18, 2);

        builder.Property(e => e.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasIndex(e => new { e.StudentId, e.CourseId, e.Status });

        builder.HasOne(e => e.Student)
            .WithMany(s => s.Enrollments)
            .HasForeignKey(e => e.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.Course)
            .WithMany(c => c.Enrollments)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ConfirmedByUser)
            .WithMany(u => u.ConfirmedEnrollments)
            .HasForeignKey(e => e.ConfirmedBy)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(e => e.Payments)
            .WithOne(p => p.Enrollment)
            .HasForeignKey(p => p.EnrollmentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(e => e.ClassStudent)
            .WithOne(cs => cs.Enrollment)
            .HasForeignKey<ClassStudent>(cs => cs.EnrollmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
