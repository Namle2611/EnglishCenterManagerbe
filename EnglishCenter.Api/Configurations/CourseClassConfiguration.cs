using EnglishCenter.Api.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EnglishCenter.Api.Configurations;

public class CourseClassConfiguration : IEntityTypeConfiguration<CourseClass>
{
    public void Configure(EntityTypeBuilder<CourseClass> builder)
    {
        builder.ToTable("Classes", t =>
        {
            t.HasCheckConstraint("CK_Classes_MaxStudents", "[MaxStudents] > 0");
            t.HasCheckConstraint("CK_Classes_Dates", "[EndDate] > [StartDate]");
        });

        builder.HasKey(c => c.Id);

        builder.Property(c => c.ClassCode)
            .IsRequired()
            .HasMaxLength(30);

        builder.HasIndex(c => c.ClassCode)
            .IsUnique();

        builder.Property(c => c.Status)
            .HasConversion<string>()
            .HasMaxLength(30);

        builder.HasOne(c => c.Course)
            .WithMany(co => co.Classes)
            .HasForeignKey(c => c.CourseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(c => c.Teacher)
            .WithMany(t => t.Classes)
            .HasForeignKey(c => c.TeacherId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.ClassStudents)
            .WithOne(cs => cs.Class)
            .HasForeignKey(cs => cs.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Schedules)
            .WithOne(s => s.Class)
            .HasForeignKey(s => s.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.AttendanceSessions)
            .WithOne(a => a.Class)
            .HasForeignKey(a => a.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Assignments)
            .WithOne(a => a.Class)
            .HasForeignKey(a => a.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Quizzes)
            .WithOne(q => q.Class)
            .HasForeignKey(q => q.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Grades)
            .WithOne(g => g.Class)
            .HasForeignKey(g => g.ClassId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(c => c.Notifications)
            .WithOne(n => n.Class)
            .HasForeignKey(n => n.ClassId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
