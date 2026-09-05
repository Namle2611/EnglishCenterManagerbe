using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class ClassStudentConfiguration : IEntityTypeConfiguration<ClassStudent>
{
    public void Configure(EntityTypeBuilder<ClassStudent> builder)
    {
        builder.ToTable("ClassStudents");

        builder.HasKey(cs => new { cs.ClassId, cs.StudentId });

        builder.HasIndex(cs => cs.EnrollmentId)
            .IsUnique();

        builder.Property(cs => cs.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(cs => cs.Class)
            .WithMany(c => c.ClassStudents)
            .HasForeignKey(cs => cs.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cs => cs.Student)
            .WithMany(s => s.ClassStudents)
            .HasForeignKey(cs => cs.StudentId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(cs => cs.Enrollment)
            .WithOne(e => e.ClassStudent)
            .HasForeignKey<ClassStudent>(cs => cs.EnrollmentId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
