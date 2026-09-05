using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.ToTable("Courses", t =>
        {
            t.HasCheckConstraint("CK_Courses_DurationMonths", "[DurationMonths] > 0");
            t.HasCheckConstraint("CK_Courses_TuitionFee", "[TuitionFee] >= 0");
        });

        builder.HasKey(c => c.Id);

        builder.Property(c => c.CourseCode)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(c => c.CourseCode)
            .IsUnique();

        builder.Property(c => c.CourseName)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(c => c.Level)
            .HasMaxLength(50);

        builder.Property(c => c.TuitionFee)
            .HasPrecision(18, 2);

        builder.Property(c => c.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasMany(c => c.Classes)
            .WithOne(cl => cl.Course)
            .HasForeignKey(cl => cl.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Sections)
            .WithOne(s => s.Course)
            .HasForeignKey(s => s.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Enrollments)
            .WithOne(e => e.Course)
            .HasForeignKey(e => e.CourseId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
